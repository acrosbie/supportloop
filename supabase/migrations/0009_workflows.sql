-- 0009_workflows.sql — LLM-in-the-loop workflow engine (v1: ticket.created).
-- Run after 0008, then seed.

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  trigger text not null,
  enabled boolean not null default true,
  steps jsonb not null default '[]',
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists workflows_org_trigger_idx on workflows (org_id, trigger);

create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  workflow_id uuid references workflows(id) on delete set null,
  workflow_name text,
  ticket_id uuid references tickets(id) on delete cascade,
  status text not null default 'success',
  steps jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists workflow_runs_ticket_idx on workflow_runs (ticket_id);
create index if not exists workflow_runs_org_idx on workflow_runs (org_id, created_at desc);

alter table workflows enable row level security;
alter table workflow_runs enable row level security;
