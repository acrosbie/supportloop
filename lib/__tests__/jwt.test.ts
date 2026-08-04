import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { signJwt, verifyJwt } from "../jwt";

const SECRET = "test-secret-do-not-use-in-production";

describe("signJwt / verifyJwt", () => {
  it("round-trips a payload", () => {
    const token = signJwt({ email: "sam@acme.com", name: "Sam", account: "Acme" }, SECRET);
    const payload = verifyJwt(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload?.email).toBe("sam@acme.com");
    expect(payload?.name).toBe("Sam");
    expect(payload?.account).toBe("Acme");
  });

  it("stamps iat and exp", () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = verifyJwt(signJwt({ email: "a@b.com" }, SECRET, 600), SECRET);
    expect(payload?.iat).toBeGreaterThanOrEqual(now - 2);
    expect(payload?.exp).toBeGreaterThanOrEqual(now + 598);
  });

  it("rejects a token signed with a different secret", () => {
    const token = signJwt({ email: "sam@acme.com" }, SECRET);
    expect(verifyJwt(token, "some-other-secret")).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = signJwt({ email: "sam@acme.com" }, SECRET);
    const [h, , s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ email: "attacker@evil.com" })).toString("base64url");
    expect(verifyJwt(`${h}.${forged}.${s}`, SECRET)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const [h, p] = signJwt({ email: "sam@acme.com" }, SECRET).split(".");
    expect(verifyJwt(`${h}.${p}.notarealsignature`, SECRET)).toBeNull();
  });

  it("rejects an expired token", () => {
    // Negative TTL puts exp in the past.
    const token = signJwt({ email: "sam@acme.com" }, SECRET, -10);
    expect(verifyJwt(token, SECRET)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyJwt("", SECRET)).toBeNull();
    expect(verifyJwt("only.two", SECRET)).toBeNull();
    expect(verifyJwt("a.b.c.d", SECRET)).toBeNull();
    expect(verifyJwt("not-a-jwt", SECRET)).toBeNull();
  });

  it("rejects a valid-shaped token whose body is not JSON", () => {
    // Signature is genuine, so this exercises the JSON.parse guard rather than the HMAC.
    const h = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const p = Buffer.from("not json").toString("base64url");
    const sig = crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest().toString("base64url");
    expect(verifyJwt(`${h}.${p}.${sig}`, SECRET)).toBeNull();
  });
});
