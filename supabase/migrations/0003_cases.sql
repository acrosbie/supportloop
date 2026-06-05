-- 0003_cases.sql — real case-management fields. Run after 0002_auth.sql.

alter table tickets add column if not exists priority text not null default 'normal'
  check (priority in ('low', 'normal', 'high', 'urgent'));
alter table tickets add column if not exists assignee_id uuid references auth.users(id) on delete set null;
alter table tickets add column if not exists tags text[] not null default '{}';
alter table tickets add column if not exists sla_due_at timestamptz;
alter table tickets add column if not exists first_response_at timestamptz;

-- Public reply vs internal note.
alter table ticket_messages add column if not exists internal boolean not null default false;

-- Macros / canned responses.
create table if not exists canned_responses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text,
  created_at timestamptz not null default now()
);

create index if not exists tickets_assignee_idx on tickets (assignee_id);
create index if not exists tickets_priority_idx on tickets (priority);
