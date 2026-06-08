-- 0008_custom_fields.sql — standard CRM fields + an admin-defined custom-field
-- system (field definitions + per-record jsonb values). Run after 0007, then seed.

-- Standard fields on customers (the person).
alter table customers add column if not exists phone text;
alter table customers add column if not exists location text;
alter table customers add column if not exists timezone text;
alter table customers add column if not exists locale text;
alter table customers add column if not exists external_id text;
alter table customers add column if not exists last_seen_at timestamptz;

-- Standard fields on accounts (the company).
alter table accounts add column if not exists domain text;
alter table accounts add column if not exists industry text;
alter table accounts add column if not exists company_size text;
alter table accounts add column if not exists region text;
alter table accounts add column if not exists arr numeric;
alter table accounts add column if not exists renewal_date date;
alter table accounts add column if not exists owner text;
alter table accounts add column if not exists external_id text;

-- Custom-field value bags (one jsonb per record).
alter table customers add column if not exists custom_fields jsonb not null default '{}';
alter table accounts add column if not exists custom_fields jsonb not null default '{}';
alter table tickets add column if not exists custom_fields jsonb not null default '{}';
alter table kb_articles add column if not exists custom_fields jsonb not null default '{}';

-- Admin-defined custom-field schema, scoped per org + entity.
create table if not exists custom_field_defs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  entity text not null check (entity in ('customer', 'account', 'ticket', 'doc')),
  key text not null,
  label text not null,
  type text not null default 'text' check (type in ('text', 'number', 'select', 'date', 'checkbox')),
  options jsonb not null default '[]',
  required boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (org_id, entity, key)
);
create index if not exists custom_field_defs_org_idx on custom_field_defs (org_id, entity);
alter table custom_field_defs enable row level security;
