import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const attempts = new Map<string, { count: number; resetAt: number }>();
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"; const now = Date.now(); const entry = attempts.get(ip);
  if (entry && entry.resetAt > now && entry.count >= 5) { await new Promise((resolve) => setTimeout(resolve, 1200)); return Response.json({ error: "Çok fazla deneme. Bir dakika bekleyin." }, { status: 429 }); }
  const { password } = await request.json() as { password?: string }; const expected = process.env.APP_PASSWORD ?? "";
  const suppliedBuffer = Buffer.from(password ?? ""); const expectedBuffer = Buffer.from(expected); const valid = suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
  if (!valid) { attempts.set(ip, { count: (entry?.resetAt ?? 0) > now ? entry!.count + 1 : 1, resetAt: now + 60_000 }); await new Promise((resolve) => setTimeout(resolve, 400)); return Response.json({ error: "Şifre doğru değil." }, { status: 401 }); }
  attempts.delete(ip); const expires = Date.now() + 7 * 24 * 60 * 60 * 1000; const payload = String(expires); const signature = createHmac("sha256", process.env.SESSION_SECRET ?? "kade-studio-local-session-secret").update(payload).digest("hex");
  (await cookies()).set("kade_session", `${payload}.${signature}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expires) }); return Response.json({ ok: true });
}
