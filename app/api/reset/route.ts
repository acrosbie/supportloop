import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Reseeding computes embeddings and inserts ~200 tickets — give it room on Vercel.
export const maxDuration = 60;

// POST /api/reset — wipe and reseed all demo data to the clean baseline.
export async function POST() {
  try {
    const counts = await seedDatabase();
    return NextResponse.json({ ok: true, counts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Reset failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
