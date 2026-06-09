-- 0011_rbac.sql — role-based access control. Run after 0010, then seed.
--   • Agent teams: a `groups` table; each agent profile gets a group + a
--     group_role ('member' | 'admin').
--   • Account roles: each customer is an 'admin' or 'member' of their account.

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists groups_org_idx on groups (org_id);
alter table groups enable row level security;

alter table profiles add column if not exists group_id uuid references groups(id) on delete set null;
alter table profiles add column if not exists group_role text; -- 'member' | 'admin'

alter table customers add column if not exists account_role text not null default 'member'; -- 'member' | 'admin'
