// LLM-in-the-loop workflow engine (v1: the ticket.created trigger). A workflow
// is a trigger + an ordered list of steps; steps are deterministic or LLM-backed
// and act on the ticket, its customer, and its account. Every run is logged.
import { supabaseAdmin } from "./supabase";
import { MODEL_CLASSIFY, MODEL_GENERATE, anthropic, parseJson, textOf } from "./anthropic";
import { retrieve } from "./retrieve";
import { decideGrounding } from "./guardrail";
import {
  getTicket,
  saveTriage,
  appendAgentReply,
  getCustomerContext,
  getCustomFieldDefs,
  updateEntityFields,
  logAiTrace,
  type Triage,
} from "./data";

export type WorkflowStepType = "triage" | "priority_by_account" | "draft_reply" | "extract_fields";
export interface WorkflowStep {
  type: WorkflowStepType;
}
export interface WorkflowDef {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  steps: WorkflowStep[];
}
export interface StepLog {
  step: string;
  status: "ok" | "skipped" | "error";
  detail: string;
}
export interface WorkflowRunView {
  id: string;
  workflow_name: string;
  status: string;
  steps: StepLog[];
  created_at: string;
}

export const STEP_LABEL: Record<WorkflowStepType, string> = {
  triage: "AI triage",
  priority_by_account: "Prioritize by account",
  draft_reply: "Draft grounded reply",
  extract_fields: "Extract custom fields",
};

async function getEnabledWorkflows(orgId: string, trigger: string): Promise<WorkflowDef[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("workflows")
      .select("id,name,trigger,enabled,steps")
      .eq("org_id", orgId)
      .eq("trigger", trigger)
      .eq("enabled", true)
      .order("position", { ascending: true });
    return (data ?? []).map((w) => ({
      id: w.id as string,
      name: w.name as string,
      trigger: w.trigger as string,
      enabled: w.enabled as boolean,
      steps: ((w.steps as WorkflowStep[]) ?? []).filter((s) => s && typeof s.type === "string"),
    }));
  } catch {
    return [];
  }
}

async function recordRun(
  orgId: string,
  wf: WorkflowDef,
  ticketId: string,
  status: string,
  steps: StepLog[]
): Promise<void> {
  try {
    await supabaseAdmin().from("workflow_runs").insert({
      org_id: orgId,
      workflow_id: wf.id,
      workflow_name: wf.name,
      ticket_id: ticketId,
      status,
      steps,
    });
  } catch {
    /* logging is best-effort */
  }
}

type StepResult = { detail: string; skipped?: boolean };

/** Run all enabled ticket.created workflows against a ticket. Best-effort. */
export async function runTicketCreated(orgId: string, ticketId: string): Promise<void> {
  const workflows = await getEnabledWorkflows(orgId, "ticket.created");
  for (const wf of workflows) {
    const log: StepLog[] = [];
    let status = "success";
    for (const step of wf.steps) {
      try {
        const res = await runStep(orgId, ticketId, step);
        log.push({ step: STEP_LABEL[step.type] ?? step.type, status: res.skipped ? "skipped" : "ok", detail: res.detail });
      } catch (e) {
        log.push({ step: STEP_LABEL[step.type] ?? step.type, status: "error", detail: e instanceof Error ? e.message : "error" });
        status = "error";
      }
    }
    await recordRun(orgId, wf, ticketId, status, log);
  }
}

function runStep(orgId: string, ticketId: string, step: WorkflowStep): Promise<StepResult> {
  switch (step.type) {
    case "triage":
      return triageStep(orgId, ticketId);
    case "priority_by_account":
      return priorityStep(orgId, ticketId);
    case "draft_reply":
      return draftStep(orgId, ticketId);
    case "extract_fields":
      return extractStep(orgId, ticketId);
    default:
      return Promise.resolve({ detail: "unknown step", skipped: true });
  }
}

// --- Steps -----------------------------------------------------------------

async function triageStep(orgId: string, ticketId: string): Promise<StepResult> {
  const ticket = await getTicket(orgId, ticketId);
  if (!ticket) return { detail: "ticket not found", skipped: true };
  const system = `You triage customer support tickets. Respond with ONLY a JSON object (no prose):
{"intent":"<short topic>","urgency":"low"|"medium"|"high","queue":"Billing"|"Technical"|"Account"|"Recordings"|"Admin","sentiment":"<one word>"}`;
  const t0 = Date.now();
  const msg = await anthropic().messages.create({
    model: MODEL_CLASSIFY,
    max_tokens: 200,
    system,
    messages: [{ role: "user", content: `Subject: ${ticket.subject}\n\n${ticket.body}` }],
  });
  const tri = parseJson<Triage>(textOf(msg));
  await saveTriage(orgId, ticketId, tri);
  await logAiTrace(orgId, {
    surface: "workflow:triage",
    model: MODEL_CLASSIFY,
    latencyMs: Date.now() - t0,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
    ticketId,
  });
  return { detail: `intent=${tri.intent}, urgency=${tri.urgency}, queue=${tri.queue}` };
}

async function priorityStep(orgId: string, ticketId: string): Promise<StepResult> {
  const [ticket, ctx] = await Promise.all([getTicket(orgId, ticketId), getCustomerContext(orgId, ticketId)]);
  if (!ticket) return { detail: "ticket not found", skipped: true };
  const plan = ctx?.account?.plan?.toLowerCase();
  const atRisk = ctx?.account?.health === "at_risk" || ctx?.account?.health === "churning";
  let priority = ticket.priority;
  if (plan === "enterprise" || atRisk) priority = "urgent";
  else if (plan === "business" || ticket.urgency === "high") priority = "high";
  if (priority === ticket.priority) return { detail: `priority unchanged (${priority})`, skipped: true };
  await supabaseAdmin().from("tickets").update({ priority }).eq("id", ticketId).eq("org_id", orgId);
  const why = atRisk ? "at-risk account" : ctx?.account ? `${ctx.account.name} · ${ctx.account.plan}` : `urgency ${ticket.urgency}`;
  return { detail: `priority → ${priority} (${why})` };
}

async function draftStep(orgId: string, ticketId: string): Promise<StepResult> {
  const ticket = await getTicket(orgId, ticketId);
  if (!ticket) return { detail: "ticket not found", skipped: true };
  const query = `${ticket.subject}\n\n${ticket.body}`;
  let matches;
  try {
    matches = await retrieve(query, orgId, 5);
  } catch {
    return { detail: "retrieval unavailable", skipped: true };
  }
  const decision = decideGrounding(matches);
  if (!decision.grounded) {
    return { detail: `no confident KB match (top ${decision.topSimilarity.toFixed(2)}) — left for an agent`, skipped: true };
  }
  const context = decision.sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.body}`).join("\n\n");
  const system = `You are a friendly support agent. Draft a concise reply to the customer using ONLY the knowledge below. Do not invent policy or steps. End by offering further help.\n\nKnowledge:\n${context}`;
  const t0 = Date.now();
  const msg = await anthropic().messages.create({
    model: MODEL_GENERATE,
    max_tokens: 400,
    system,
    messages: [{ role: "user", content: query }],
  });
  const draft = textOf(msg);
  await appendAgentReply(orgId, ticketId, `🤖 Suggested reply (AI draft · grounded):\n\n${draft}`, true);
  await logAiTrace(orgId, {
    surface: "workflow:draft",
    model: MODEL_GENERATE,
    latencyMs: Date.now() - t0,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
    grounded: true,
    topSimilarity: decision.topSimilarity,
    ticketId,
  });
  return { detail: `drafted grounded reply (top ${decision.topSimilarity.toFixed(2)}) as an internal note` };
}

async function extractStep(orgId: string, ticketId: string): Promise<StepResult> {
  const [ticket, defs] = await Promise.all([getTicket(orgId, ticketId), getCustomFieldDefs(orgId, "ticket")]);
  if (!ticket) return { detail: "ticket not found", skipped: true };
  if (!defs.length) return { detail: "no ticket custom fields defined", skipped: true };
  const schema = defs
    .map((d) => `- ${d.key} (${d.type}${d.options.length ? `; one of: ${d.options.join(", ")}` : ""}): ${d.label}`)
    .join("\n");
  const system = `Extract values for these custom fields from the support ticket. Respond with ONLY a JSON object mapping each field key to its value (use null when not present). For select fields use only the listed options.\nFields:\n${schema}`;
  const t0 = Date.now();
  const msg = await anthropic().messages.create({
    model: MODEL_CLASSIFY,
    max_tokens: 200,
    system,
    messages: [{ role: "user", content: `Subject: ${ticket.subject}\n\n${ticket.body}` }],
  });
  const extracted = parseJson<Record<string, unknown>>(textOf(msg));
  const custom: Record<string, unknown> = {};
  for (const d of defs) {
    const v = extracted[d.key];
    if (v != null && v !== "") custom[d.key] = v;
  }
  await logAiTrace(orgId, {
    surface: "workflow:extract",
    model: MODEL_CLASSIFY,
    latencyMs: Date.now() - t0,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
    ticketId,
  });
  if (!Object.keys(custom).length) return { detail: "nothing to extract", skipped: true };
  await updateEntityFields(orgId, "ticket", ticketId, {}, custom);
  return { detail: `set ${Object.entries(custom).map(([k, v]) => `${k}=${v}`).join(", ")}` };
}

// --- Reads for the UI ------------------------------------------------------

export async function getWorkflowRunsForTicket(orgId: string, ticketId: string): Promise<WorkflowRunView[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("workflow_runs")
      .select("id,workflow_name,status,steps,created_at")
      .eq("org_id", orgId)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((r) => ({
      id: r.id as string,
      workflow_name: (r.workflow_name as string) ?? "Workflow",
      status: r.status as string,
      steps: (r.steps as StepLog[]) ?? [],
      created_at: r.created_at as string,
    }));
  } catch {
    return [];
  }
}

export interface WorkflowListItem extends WorkflowDef {
  runCount: number;
  lastRunAt: string | null;
}

export async function listWorkflows(orgId: string): Promise<WorkflowListItem[]> {
  try {
    const sb = supabaseAdmin();
    const { data: wfs } = await sb
      .from("workflows")
      .select("id,name,trigger,enabled,steps")
      .eq("org_id", orgId)
      .order("position", { ascending: true });
    if (!wfs?.length) return [];
    const { data: runs } = await sb.from("workflow_runs").select("workflow_id,created_at").eq("org_id", orgId);
    const countBy = new Map<string, number>();
    const lastBy = new Map<string, string>();
    for (const r of runs ?? []) {
      const wid = r.workflow_id as string | null;
      if (!wid) continue;
      countBy.set(wid, (countBy.get(wid) ?? 0) + 1);
      const at = r.created_at as string;
      if (!lastBy.has(wid) || at > (lastBy.get(wid) as string)) lastBy.set(wid, at);
    }
    return wfs.map((w) => ({
      id: w.id as string,
      name: w.name as string,
      trigger: w.trigger as string,
      enabled: w.enabled as boolean,
      steps: ((w.steps as WorkflowStep[]) ?? []).filter((s) => s && typeof s.type === "string"),
      runCount: countBy.get(w.id as string) ?? 0,
      lastRunAt: lastBy.get(w.id as string) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function setWorkflowEnabled(orgId: string, id: string, enabled: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("workflows").update({ enabled }).eq("id", id).eq("org_id", orgId);
  if (error) throw new Error(`setWorkflowEnabled: ${error.message}`);
}

export interface RecentRun {
  id: string;
  workflow_name: string;
  ticket_id: string | null;
  status: string;
  stepCount: number;
  created_at: string;
}

export async function getRecentWorkflowRuns(orgId: string, limit = 20): Promise<RecentRun[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("workflow_runs")
      .select("id,workflow_name,ticket_id,status,steps,created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      workflow_name: (r.workflow_name as string) ?? "Workflow",
      ticket_id: (r.ticket_id as string | null) ?? null,
      status: r.status as string,
      stepCount: Array.isArray(r.steps) ? (r.steps as unknown[]).length : 0,
      created_at: r.created_at as string,
    }));
  } catch {
    return [];
  }
}
