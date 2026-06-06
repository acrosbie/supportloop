import { NextRequest, NextResponse } from "next/server";
import { retrieve } from "@/lib/retrieve";
import { resolveViewerOrgId } from "@/lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Search failed";
}

// GET /api/search?q=...&k=5  — convenient for quick browser/curl testing.
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: 'Missing "q" query parameter' }, { status: 400 });
  }
  const k = Number(req.nextUrl.searchParams.get("k") ?? 5);
  try {
    const orgId = await resolveViewerOrgId();
    const matches = await retrieve(query, orgId, k);
    return NextResponse.json({ query, matches });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

// POST { query, k?, minSimilarity? }
export async function POST(req: NextRequest) {
  try {
    const { query, k, minSimilarity } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: 'Missing "query" string' }, { status: 400 });
    }
    const orgId = await resolveViewerOrgId();
    const matches = await retrieve(query, orgId, k ?? 5, minSimilarity ?? 0);
    return NextResponse.json({ query, matches });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}
