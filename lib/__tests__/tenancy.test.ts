import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * The tenancy invariant, asserted instead of assumed.
 *
 * "One workspace's chatbot can never retrieve another's knowledge" is this
 * project's load-bearing safety claim, and until now it was enforced by
 * convention: every data-layer function takes `orgId` first, and every route
 * goes through the data layer. Conventions hold right up until the afternoon
 * someone adds a function in a hurry.
 *
 * These are structural tests, not integration tests. They cannot prove a query
 * returns the right rows without a database, but they can prove the shape that
 * makes leaking hard is still intact — and unlike an integration test, they run
 * in CI in milliseconds with no credentials, which means they actually run.
 */

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

describe("tenancy: the data layer", () => {
  it("takes orgId as the first parameter of every exported function", () => {
    const src = read("lib/data.ts");
    const pattern = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)/gs;
    const offenders: string[] = [];
    let m: RegExpExecArray | null;
    let total = 0;
    while ((m = pattern.exec(src)) !== null) {
      total++;
      const [, name, params] = m;
      const first = params.trim().split(",")[0]?.trim() ?? "";
      if (!first.startsWith("orgId")) offenders.push(`${name}(${first || "no params"})`);
    }
    // A guard against the regex silently matching nothing and the test passing
    // for the wrong reason.
    expect(total).toBeGreaterThan(50);
    expect(offenders).toEqual([]);
  });
});

describe("tenancy: retrieval is scoped in SQL", () => {
  /** The latest definition wins: 0001 creates match_kb, 0004 re-creates it org-scoped. */
  function latestFunctionBody(fnName: string): string {
    const dir = path.join(root, "supabase", "migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    let found = "";
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), "utf8");
      const re = new RegExp(`create\\s+or\\s+replace\\s+function\\s+${fnName}\\b[\\s\\S]*?\\$\\$;`, "gi");
      const matches = sql.match(re);
      if (matches?.length) found = matches[matches.length - 1];
    }
    return found;
  }

  it("scopes match_kb to the caller's org", () => {
    const body = latestFunctionBody("match_kb");
    expect(body).not.toBe("");
    // The filter is the whole point: without it, one tenant's query retrieves
    // another tenant's articles.
    expect(body).toMatch(/org_id\s*=\s*p_org_id/i);
  });

  it("scopes match_tickets to the caller's org", () => {
    const body = latestFunctionBody("match_tickets");
    expect(body).not.toBe("");
    expect(body).toMatch(/org_id\s*=\s*p_org_id/i);
  });
});

describe("tenancy: routes go through the data layer", () => {
  it("keeps the service-role client out of route handlers", () => {
    /**
     * Two deliberate exceptions, both of which cannot be org-scoped by
     * definition:
     *   auth/signup — creates the organization, so there is no org yet
     *   cron/sla    — sweeps every org on a schedule, intentionally cross-org
     * Anything else reaching for supabaseAdmin is skipping the layer where the
     * orgId-first invariant is enforced.
     */
    const allowed = new Set(["app/api/auth/signup/route.ts", "app/api/cron/sla/route.ts"]);

    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (entry.name.endsWith(".ts") && read(rel).includes("supabaseAdmin") && !allowed.has(rel)) {
          offenders.push(rel);
        }
      }
    };
    walk("app/api");

    expect(offenders).toEqual([]);
  });
});
