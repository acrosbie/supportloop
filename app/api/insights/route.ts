import { getStaffOrgId } from "@/lib/auth";
import { getInsightsData } from "@/lib/data";
import { MODEL_CLASSIFY, anthropic, textOf } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

// "What changed this week" — a grounded executive summary of the real ticket
// movement. Recomputed server-side (never trusts client numbers).
export async function POST() {
  const orgId = await getStaffOrgId();
  if (!orgId) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const data = await getInsightsData(orgId);
  if (data.thisWeekTotal === 0 && data.lastWeekTotal === 0) {
    return Response.json({ ok: true, summary: "Not enough recent ticket volume to summarize yet." });
  }

  const lines = data.themes
    .map((t) => `- ${t.name}: ${t.thisWeek} this week vs ${t.lastWeek} last week (${t.trend})`)
    .join("\n");
  const system =
    "You are an analytics copilot for a customer-support team. Given this week's ticket data, write a tight 2–4 sentence executive summary of what changed and what to watch. Cite the real numbers, stay neutral and useful. No preamble, no bullet points, no markdown headings.";

  try {
    const msg = await anthropic().messages.create({
      model: MODEL_CLASSIFY,
      max_tokens: 250,
      system,
      messages: [
        {
          role: "user",
          content: `This week: ${data.thisWeekTotal} tickets (${data.resolvedThisWeek} resolved). Last week: ${data.lastWeekTotal}.\n\nTop themes by volume:\n${lines}`,
        },
      ],
    });
    return Response.json({ ok: true, summary: textOf(msg) });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Summary failed" }, { status: 502 });
  }
}
