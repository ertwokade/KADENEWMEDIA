import { NextResponse, type NextRequest } from "next/server";

async function sign(value: string, secret: string) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
export async function proxy(request: NextRequest) {
  if (!process.env.APP_PASSWORD || process.env.NODE_ENV === "test" || request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/api/auth") || request.nextUrl.pathname.startsWith("/_next")) return NextResponse.next();
  const [expires, signature] = request.cookies.get("kade_session")?.value.split(".") ?? []; const valid = expires && signature && Number(expires) > Date.now() && (await sign(expires, process.env.SESSION_SECRET ?? "kade-studio-local-session-secret")) === signature;
  if (valid) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) return Response.json({ error: "Oturum gerekli." }, { status: 401 });
  return NextResponse.redirect(new URL("/login", request.url));
}
export const config = { matcher: ["/((?!favicon.ico).*)"] };
