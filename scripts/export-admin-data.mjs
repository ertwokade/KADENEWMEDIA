import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mongodb from "mongodb";
import { EJSON } from "bson";

const { MongoClient, ServerApiVersion } = mongodb;

const root = process.cwd();
const envPath = path.join(root, ".vercel", ".env.production.local");
const dbName = process.env.KADE_DB_NAME || "kademedia";

function parseEnv(content) {
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value.replace(/\\n/g, "\n");
  }
  return env;
}

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

const env = parseEnv(await fs.readFile(envPath, "utf8"));
const rawUri = process.env.MONGODB_URI || env.MONGODB_URI;
let uri = rawUri;
if (!uri) {
  throw new Error("MONGODB_URI was not found in .vercel/.env.production.local");
}

async function resolveDnsJson(name, type) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const res = await fetch(url, { headers: { Accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DNS lookup failed for ${name} ${type}: ${res.status}`);
  const data = await res.json();
  if (data.Status !== 0 || !Array.isArray(data.Answer)) {
    throw new Error(`DNS lookup returned no answer for ${name} ${type}`);
  }
  return data.Answer;
}

async function expandSrvMongoUri(value) {
  if (!value.startsWith("mongodb+srv://")) return value;

  const parsed = new URL(value);
  const host = parsed.hostname;
  const srvAnswers = await resolveDnsJson(`_mongodb._tcp.${host}`, "SRV");
  const txtAnswers = await resolveDnsJson(host, "TXT").catch(() => []);

  const hosts = srvAnswers
    .map((answer) => String(answer.data || "").trim().split(/\s+/))
    .filter((parts) => parts.length === 4)
    .map(([, , port, target]) => `${target.replace(/\.$/, "")}:${port}`);

  if (hosts.length === 0) throw new Error(`No MongoDB SRV hosts found for ${host}`);

  const params = new URLSearchParams(parsed.search);
  for (const answer of txtAnswers) {
    const txt = String(answer.data || "").replace(/^"|"$/g, "");
    for (const [key, val] of new URLSearchParams(txt)) {
      if (!params.has(key)) params.set(key, val);
    }
  }
  if (!params.has("authSource")) params.set("authSource", "admin");
  params.set("tls", "true");

  const authPart = parsed.username
    ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@`
    : "";
  return `mongodb://${authPart}${hosts.join(",")}/${parsed.pathname.replace(/^\//, "")}?${params.toString()}`;
}

uri = await expandSrvMongoUri(uri);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(root, "admin-data-backups", stamp);
const collectionsDir = path.join(outDir, "collections");
await fs.mkdir(collectionsDir, { recursive: true });

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
  connectTimeoutMS: 15000,
  socketTimeoutMS: 60000,
});

try {
  await client.connect();
  const db = client.db(dbName);
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const summary = {
    generatedAt: new Date().toISOString(),
    database: dbName,
    collectionCount: collections.length,
    collections: {},
  };

  for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const docs = await db.collection(name).find({}).toArray();
    const fileName = `${safeName(name)}.ejson.json`;
    const serialized = EJSON.stringify(docs, { relaxed: false }, 2);
    await fs.writeFile(path.join(collectionsDir, fileName), serialized, "utf8");
    summary.collections[name] = {
      count: docs.length,
      file: `collections/${fileName}`,
      bytes: Buffer.byteLength(serialized, "utf8"),
    };
  }

  await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
  await fs.writeFile(
    path.join(outDir, "README.txt"),
    [
      "Kade Media admin MongoDB backup",
      `Generated at: ${summary.generatedAt}`,
      `Database: ${dbName}`,
      "",
      "Files are stored as MongoDB Extended JSON (EJSON) to preserve ObjectId and Date values.",
      "This folder can contain private customer/admin data. Do not commit or share it publicly.",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(`Exported ${collections.length} collections to ${outDir}`);
  for (const [name, info] of Object.entries(summary.collections)) {
    console.log(`${name}: ${info.count}`);
  }
} finally {
  await client.close();
}
