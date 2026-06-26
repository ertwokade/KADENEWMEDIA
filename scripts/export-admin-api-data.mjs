import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const baseUrl = process.env.KADE_ADMIN_BASE_URL || "https://www.kademedia.com.tr";
const username = process.env.KADE_ADMIN_USER;
const password = process.env.KADE_ADMIN_PASS;

if (!username || !password) {
  throw new Error("Set KADE_ADMIN_USER and KADE_ADMIN_PASS before running this script.");
}

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(root, "admin-data-backups", `api-${stamp}`);
const collectionsDir = path.join(outDir, "collections");
const extraDir = path.join(outDir, "extra");
const mediaDir = path.join(outDir, "media-files");
const errors = [];

let csrfToken = "";
const cookies = new Map();

function splitSetCookie(header) {
  if (!header) return [];
  return header.split(/,(?=\s*[^;,=]+=[^;,]+)/g).map((part) => part.trim()).filter(Boolean);
}

function rememberCookies(res) {
  const setCookies = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : splitSetCookie(res.headers.get("set-cookie"));

  for (const cookie of setCookies) {
    const first = cookie.split(";")[0];
    const eq = first.indexOf("=");
    if (eq > 0) cookies.set(first.slice(0, eq), first.slice(eq + 1));
  }
}

function cookieHeader() {
  return Array.from(cookies.entries()).map(([key, value]) => `${key}=${value}`).join("; ");
}

async function readJson(res, label) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${label} returned non-JSON response: ${text.slice(0, 200)}`);
  }
}

async function request(route, options = {}) {
  const url = new URL(route, `${baseUrl}/api/`);
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    Accept: "application/json",
    "User-Agent": "kademedia-admin-data-export",
    ...(options.headers || {}),
  };

  const currentCookies = cookieHeader();
  if (currentCookies) headers.Cookie = currentCookies;
  if (!headers["Content-Type"] && options.body !== undefined) headers["Content-Type"] = "application/json";
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) headers["X-CSRF-Token"] = csrfToken;

  const res = await fetch(url, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    redirect: "manual",
  });
  rememberCookies(res);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${method} ${url.pathname}${url.search} failed: ${res.status} ${res.statusText} ${body.slice(0, 300)}`);
  }

  return readJson(res, `${method} ${url.pathname}${url.search}`);
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

async function capture(name, route) {
  try {
    const data = await request(route);
    await writeJson(path.join(extraDir, `${safeFileName(name)}.json`), data);
    return data;
  } catch (error) {
    errors.push({ name, route, error: error.message });
    return null;
  }
}

await fs.mkdir(collectionsDir, { recursive: true });
await fs.mkdir(extraDir, { recursive: true });
await fs.mkdir(mediaDir, { recursive: true });

const login = await request("auth", {
  method: "POST",
  body: { username, password },
});
csrfToken = login?.csrfToken || cookies.get("kade_csrf") || "";

const session = await request("auth?action=session");
await writeJson(path.join(outDir, "session.json"), session);

let backup = null;
try {
  backup = await request("ops?resource=backup", { method: "POST" });
  await writeJson(path.join(outDir, "backup.raw.json"), backup);
  if (backup?.data && typeof backup.data === "object") {
    for (const [name, items] of Object.entries(backup.data)) {
      await writeJson(path.join(collectionsDir, `${safeFileName(name)}.json`), items);
    }
  }
} catch (error) {
  errors.push({ name: "backup", route: "ops?resource=backup", error: error.message });
}

const extras = {
  users: "users",
  siteContent: "content",
  messages_latest: "messages",
  newsletter: "contact?action=subscribers",
  notifications: "notifications",
  activity_log: "notifications?action=activity",
  reminders: "reminders",
  media: "media",
  email_templates: "ops?resource=email-templates",
  onboarding_forms: "ops?resource=onboarding",
  push_subscriptions: "ops?resource=push",
  client_errors: "ops?resource=client-errors",
  customer_profiles: "ops?resource=customer-profiles",
  ai_usage_summary: "content?action=ai-usage",
  analytics_week: "content?action=analytics&period=week",
  analytics_month: "content?action=analytics&period=month",
};

const extraData = {};
for (const [name, route] of Object.entries(extras)) {
  extraData[name] = await capture(name, route);
}

const messages = Array.isArray(backup?.data?.messages)
  ? backup.data.messages
  : Array.isArray(extraData.messages_latest)
    ? extraData.messages_latest
    : [];

const notes = [];
for (const message of messages) {
  const id = message?._id;
  if (!id) continue;
  try {
    const messageNotes = await request(`messages?action=notes&messageId=${encodeURIComponent(String(id))}`);
    notes.push(...messageNotes);
  } catch (error) {
    errors.push({ name: "notes", route: `messages?action=notes&messageId=${id}`, error: error.message });
  }
}
await writeJson(path.join(extraDir, "notes.json"), notes);

const mediaItems = Array.isArray(extraData.media) ? extraData.media : [];
const mediaFiles = [];
for (const item of mediaItems) {
  const id = item?._id;
  if (!id) continue;
  try {
    const file = await request(`media?id=${encodeURIComponent(String(id))}&action=file`);
    const baseName = safeFileName(`${item.name || id}.json`);
    await writeJson(path.join(mediaDir, baseName), file);
    mediaFiles.push({ id, name: item.name || "", file: `media-files/${baseName}` });
  } catch (error) {
    errors.push({ name: "media-file", route: `media?id=${id}&action=file`, error: error.message });
  }
}

const collectionCounts = {};
if (backup?.data) {
  for (const [name, items] of Object.entries(backup.data)) {
    collectionCounts[name] = Array.isArray(items) ? items.length : null;
  }
}

const extraCounts = {};
for (const [name, data] of Object.entries(extraData)) {
  extraCounts[name] = Array.isArray(data) ? data.length : data ? 1 : null;
}
extraCounts.notes = notes.length;
extraCounts.media_files = mediaFiles.length;

const summary = {
  generatedAt: new Date().toISOString(),
  source: baseUrl,
  authenticatedAs: session?.user || null,
  backupCollections: collectionCounts,
  extra: extraCounts,
  mediaFiles,
  errors,
};

await writeJson(path.join(outDir, "summary.json"), summary);
await fs.writeFile(
  path.join(outDir, "README.txt"),
  [
    "Kade Media live admin API data export",
    `Generated at: ${summary.generatedAt}`,
    `Source: ${baseUrl}`,
    "",
    "collections/ contains the built-in admin backup collections.",
    "extra/ contains admin endpoints not covered by the built-in backup.",
    "media-files/ contains per-media JSON with base64 payloads when available.",
    "",
    "This directory can contain private customer/admin data. Keep it out of Git and public storage.",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Exported admin data to ${outDir}`);
console.log(JSON.stringify({ backupCollections: collectionCounts, extra: extraCounts, errors: errors.length }, null, 2));
