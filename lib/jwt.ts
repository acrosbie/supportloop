import crypto from "crypto";

// Minimal HS256 JWT (no dependency) for the Intercom-style identity handshake.
// The host app signs a token with the org's secret; we verify + auto-provision.

const b64url = (buf: Buffer): string => buf.toString("base64url");

export function signJwt(payload: Record<string, unknown>, secret: string, expiresInSec = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(Buffer.from(JSON.stringify({ iat: now, exp: now + expiresInSec, ...payload })));
  const sig = b64url(crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string, secret: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const expected = b64url(crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest());
    const a = Buffer.from(s);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8")) as Record<string, unknown>;
    if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
