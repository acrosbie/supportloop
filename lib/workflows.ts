// LLM-in-the-loop workflow engine. A workflow is a trigger + an optional rule
// condition + an ordered list of steps; steps are deterministic or LLM-backed
// and act on the ticket, its customer, and its account. Every run is logged.
//   v1: ticket.created intake (triage, prioritize, draft, extract).
//   v2: conditions + the csat.submitted trigger + account/ticket-mutating actions.
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
  type CustomerContext,
} from "./data";
import { isStandardKey } from "./fields";
import { firstResponseSla, resolutionSla } from "./sla";
import type { Ticket } from "./types";

export type WorkflowTrigger = "ticket.created" | "csat.submitted" | "sla.breach" | "status.changed" | "webhook.received";
export type WorkflowStepType =
  | "triage"
  | "priority_by_account"
  | "draft_reply"
  | "extract_fields"
  | "escalate"
  | "flag_account_at_risk"
  | "add_internal_note"
  | "set_customer_field";

export interface WorkflowStep {
  type: WorkflowStepType;
  message?: string;
  field?: string;
  value?: unknown;
}
export interface Predicate {
  field: string;
  op: string;
  value: unknown;
}
export interface Condition {
  all?: Predicate[];
}
export interface WorkflowDef {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  steps: WorkflowStep[];
  condition: Condition;
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
  escalate: "Escalate ticket",
  flag_account_at_risk: "Flag account at-risk",
  add_internal_note: "Add internal note",
  set_customer_field: "Set customer field",
};

function normalizeWorkflow(w: Record<string, unknown>): WorkflowDef {
  return {
    id: w.id as string,
    name: w.name as string,
    trigger: w.trigger as string,
    enabled: w.enabled as boolean,
    steps: ((w.steps as WorkflowStep[]) ?? []).filter((s) => s && typeof s.type === "string"),
    condition: (w.condition as Condition) ?? {},
  };
}

async function getEnabledWorkflows(orgId: string, trigger: string): Promise<WorkflowDef[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("workflows")
      .select("*")
      .eq("org_id", orgId)
      .eq("trigger", trigger)
      .eq("enabled", true)
      .order("position", { ascending: true });
    return (data ?? []).map((w) => normalizeWorkflow(w as Record<string, unknown>));
  } catch {
    return [];
  }
}

async function recordRun(orgId: string, wf: WorkflowDef, ticketId: string, status: string, steps: StepLog[]): Promise<void> {
  try {
    await supabaseAdmin()
      .from("workflow_runs")
      .insert({ org_id: orgId, workflow_id: wf.id, workflow_name: wf.name, ticket_id: ticketId, status, steps });
  } catch {
    /* logging is best-effort */
  }
}

// --- Context + conditions --------------------------------------------------

interface RunContext {
  ticket: Ticket;
  ctx: CustomerContext | null;
}

async function loadContext(orgId: string, ticketId: string): Promise<RunContext | null> {
  const [ticket, ctx] = await Promise.all([getTicket(orgId, ticketId), getCustomerContext(orgId, ticketId)]);
  if (!ticket) return null;
  return { ticket, ctx };
}

function resolveField(field: string, c: RunContext): unknown {
  const dot = field.indexOf(".");
  const root = dot === -1 ? field : field.slice(0, dot);
  const rest = dot === -1 ? "" : field.slice(dot + 1);
  if (root === "ticket") {
    if (rest.startsWith("custom_fields.")) return (c.ticket.custom_fields ?? {})[rest.slice("custom_fields.".length)];
    return (c.ticket as unknown as Record<string, unknown>)[rest];
  }
  if (root === "account") return c.ctx?.account ? (c.ctx.account as unknown as Record<string, unknown>)[rest] : undefined;
  if (root === "customer") return c.ctx?.customer ? (c.ctx.customer as unknown as Record<string, unknown>)[rest] : undefined;
  return undefined;
}

function evalPredicate(op: string, actual: unknown, expected: unknown): boolean {
  switch (op) {
    case "eq":
      return actual === expected || String(actual) === String(expected);
    case "ne":
      return String(actual) !== String(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    case "gt":
      return Number(actual) > Number(expected);
    case "gte":
      return Number(actual) >= Number(expected);
    case "contains":
      return String(actual ?? "").toLowerCase().includes(String(expected).toLowerCase());
    case "in":
      return Array.isArray(expected) && expected.map(String).includes(String(actual));
    default:
      return false;
  }
}

function evalCondition(condition: Condition, c: RunContext): boolean {
  const all = condition?.all;
  if (!all || all.length === 0) return true;
  return all.every((p) => evalPredicate(p.op, resolveField(p.field, c), p.value));
}

// --- Executor --------------------------------------------------------------

type StepResult = { detail: string; skipped?: boolean };

export async function runWorkflows(orgId: string, trigger: WorkflowTrigger, ticketId: string): Promise<void> {
  const workflows = await getEnabledWorkflows(orgId, trigger);
  if (!workflows.length) return;
  const context = await loadContext(orgId, ticketId);
  if (!context) return;

  for (const wf of workflows) {
    if (!evalCondition(wf.condition, context)) {
      await recordRun(orgId, wf, ticketId, "skipped", [{ step: "Condition", status: "skipped", detail: "condition not met" }]);
      continue;
    }
    const log: StepLog[] = [];
    let status = "success";
    for (const step of wf.steps) {
      try {
        const res = await runStep(orgId, ticketId, step, context);
        log.push({ step: STEP_LABEL[step.type] ?? step.type, status: res.skipped ? "skipped" : "ok", detail: res.detail });
      } catch (e) {
        log.push({ step: STEP_LABEL[step.type] ?? step.type, status: "error", detail: e instanceof Error ? e.message : "error" });
        status = "error";
      }
    }
    await recordRun(orgId, wf, ticketId, status, log);
  }
}

export const runTicketCreated = (orgId: string, ticketId: string) => runWorkflows(orgId, "ticket.created", ticketId);
export const runCsatSubmitted = (orgId: string, ticketId: string) => runWorkflows(orgId, "csat.submitted", ticketId);
export const runStatusChanged = (orgId: string, ticketId: string) => runWorkflows(orgId, "status.changed", ticketId);
export const runWebhookReceived = (orgId: string, ticketId: string) => runWorkflows(orgId, "webhook.received", ticketId);

/** Scan open tickets for first-response/resolution breaches and fire the
 *  sla.breach workflows once per ticket (deduped via tickets.sla_breached_at).
 *  Returns the number of tickets that newly breached. Best-effort (needs 0012). */
export async function runSlaSweep(orgId: string): Promise<number> {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("tickets")
      .select("id,status,priority,created_at,first_response_at,resolved_at,sla_breached_at")
      .eq("org_id", orgId)
      .in("status", ["open", "assisted"]);
    if (error) return 0; // 0012 not applied
    const now = Date.now();
    let fired = 0;
    for (const r of data ?? []) {
      if (r.sla_breached_at) continue; // already handled
      const t = r as unknown as Ticket;
      if (firstResponseSla(t, now).state === "breached" || resolutionSla(t, now).state === "breached") {
        await sb.from("tickets").update({ sla_breached_at: new Date(now).toISOString() }).eq("id", r.id).eq("org_id", orgId);
        await runWorkflows(orgId, "sla.breach", r.id as string).catch(() => {});
        fired++;
      }
    }
    return fired;
  } catch {
    return 0;
  }
}

function runStep(orgId: string, ticketId: string, step: WorkflowStep, context: RunContext): Promise<StepResult> {
  switch (step.type) {
    case "triage":
      return triageStep(orgId, ticketId);
    case "priority_by_account":
      return priorityStep(orgId, ticketId, context);
    case "draft_reply":
      return draftStep(orgId, ticketId);
    case "extract_fields":
      return extractStep(orgId, ticketId);
    case "escalate":
      return escalateStep(orgId, ticketId, context);
    case "flag_account_at_risk":
      return flagAccountStep(orgId, context);
    case "add_internal_note":
      return noteStep(orgId, ticketId, step);
    case "set_customer_field":
      return setCustomerFieldStep(orgId, step, context);
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

async function priorityStep(orgId: string, ticketId: string, c: RunContext): Promise<StepResult> {
  const ticket = await getTicket(orgId, ticketId);
  if (!ticket) return { detail: "ticket not found", skipped: true };
  const plan = c.ctx?.account?.plan?.toLowerCase();
  const atRisk = c.ctx?.account?.health === "at_risk" || c.ctx?.account?.health === "churning";
  let priority = ticket.priority;
  if (plan === "enterprise" || atRisk) priority = "urgent";
  else if (plan === "business" || ticket.urgency === "high") priority = "high";
  if (priority === ticket.priority) return { detail: `priority unchanged (${priority})`, skipped: true };
  await supabaseAdmin().from("tickets").update({ priority }).eq("id", ticketId).eq("org_id", orgId);
  const why = atRisk ? "at-risk account" : c.ctx?.account ? `${c.ctx.account.name} · ${c.ctx.account.plan}` : `urgency ${ticket.urgency}`;
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

async function escalateStep(orgId: string, ticketId: string, c: RunContext): Promise<StepResult> {
  const reopened = c.ticket.status === "resolved" || c.ticket.status === "deflected";
  const priority = c.ticket.priority === "urgent" ? "urgent" : "high";
  const patch: Record<string, unknown> = { priority };
  if (reopened) patch.status = "assisted";
  await supabaseAdmin().from("tickets").update(patch).eq("id", ticketId).eq("org_id", orgId);
  await appendAgentReply(orgId, ticketId, "⚠️ Escalated by workflow — please follow up with the customer.", true);
  return { detail: `priority → ${priority}${reopened ? ", reopened" : ""}` };
}

async function flagAccountStep(orgId: string, c: RunContext): Promise<StepResult> {
  if (!c.ctx?.account) return { detail: "no account linked", skipped: true };
  if (c.ctx.account.health === "at_risk") return { detail: `${c.ctx.account.name} already at-risk`, skipped: true };
  await supabaseAdmin().from("accounts").update({ health: "at_risk" }).eq("id", c.ctx.account.id).eq("org_id", orgId);
  return { detail: `${c.ctx.account.name} health → at_risk` };
}

async function noteStep(orgId: string, ticketId: string, step: WorkflowStep): Promise<StepResult> {
  const msg = typeof step.message === "string" && step.message.trim() ? step.message.trim() : "Note added by workflow.";
  await appendAgentReply(orgId, ticketId, `📝 ${msg}`, true);
  return { detail: "internal note added" };
}

async function setCustomerFieldStep(orgId: string, step: WorkflowStep, c: RunContext): Promise<StepResult> {
  if (!c.ctx?.customer) return { detail: "no customer linked", skipped: true };
  const field = typeof step.field === "string" ? step.field : "";
  if (!field) return { detail: "no field configured", skipped: true };
  const value = step.value ?? null;
  const std: Record<string, unknown> = {};
  const cust: Record<string, unknown> = {};
  if (isStandardKey("customer", field)) std[field] = value;
  else cust[field] = value;
  await updateEntityFields(orgId, "customer", c.ctx.customer.id, std, cust);
  return { detail: `${c.ctx.customer.name}: ${field} → ${value}` };
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
    const { data: wfs } = await sb.from("workflows").select("*").eq("org_id", orgId).order("position", { ascending: true });
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
    return wfs.map((w) => {
      const def = normalizeWorkflow(w as Record<string, unknown>);
      return { ...def, runCount: countBy.get(def.id) ?? 0, lastRunAt: lastBy.get(def.id) ?? null };
    });
  } catch {
    return [];
  }
}

export async function setWorkflowEnabled(orgId: string, id: string, enabled: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("workflows").update({ enabled }).eq("id", id).eq("org_id", orgId);
  if (error) throw new Error(`setWorkflowEnabled: ${error.message}`);
}

export async function createWorkflow(
  orgId: string,
  input: { name: string; trigger: string; condition: Condition; steps: WorkflowStep[] }
): Promise<void> {
  const sb = supabaseAdmin();
  const { count } = await sb.from("workflows").select("id", { count: "exact", head: true }).eq("org_id", orgId);
  const { error } = await sb.from("workflows").insert({
    org_id: orgId,
    name: input.name,
    trigger: input.trigger,
    enabled: true,
    steps: input.steps,
    condition: input.condition ?? {},
    position: count ?? 0,
  });
  if (error) throw new Error(`createWorkflow: ${error.message}`);
}

export async function deleteWorkflow(orgId: string, id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("workflows").delete().eq("id", id).eq("org_id", orgId);
  if (error) throw new Error(`deleteWorkflow: ${error.message}`);
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
