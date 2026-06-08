-- 0007_customers.sql — first-class customer (user) + account objects for
-- personalization. Run after 0006, then `npm run seed`.

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  plan text not null default 'Free',
  mrr numeric not null default 0,
  seats int not null default 1,
  status text not null default 'active',
  health text not null default 'healthy',
  since date,
  created_at timestamptz not null default now()
);
create index if not exists accounts_org_idx on accounts (org_id);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  email text not null,
  name text not null,
  title text,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);
create index if not exists customers_org_idx on customers (org_id);

alter table tickets add column if not exists customer_id uuid references customers(id) on delete set null;
create index if not exists tickets_customer_idx on tickets (customer_id);

-- Defense-in-depth RLS (the app reads via the service role, which bypasses it).
alter table accounts enable row level security;
alter table customers enable row level security;
