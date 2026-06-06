-- 0004_tenancy.sql — multi-tenancy. Run after 0003_cases.sql.

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'demo',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- The demo (Orbit) + dogfood (SupportLoop) orgs.
insert into organizations (name, slug, plan)
values ('Orbit', 'orbit', 'demo'), ('SupportLoop', 'supportloop', 'internal')
on conflict (slug) do nothing;

-- Add org_id to every tenant-scoped table.
alter table profiles add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table kb_articles add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table tickets add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table ticket_messages add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table community_questions add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table community_answers add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table events add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table eval_runs add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table canned_responses add column if not exists org_id uuid references organizations(id) on delete cascade;

-- Backfill all existing rows into the Orbit org.
do $$
declare orbit uuid;
begin
  select id into orbit from organizations where slug = 'orbit';
  update profiles set org_id = orbit where org_id is null;
  update kb_articles set org_id = orbit where org_id is null;
  update tickets set org_id = orbit where org_id is null;
  update ticket_messages set org_id = orbit where org_id is null;
  update community_questions set org_id = orbit where org_id is null;
  update community_answers set org_id = orbit where org_id is null;
  update events set org_id = orbit where org_id is null;
  update eval_runs set org_id = orbit where org_id is null;
  update canned_responses set org_id = orbit where org_id is null;
end $$;

create index if not exists profiles_org_idx on profiles (org_id);
create index if not exists kb_articles_org_idx on kb_articles (org_id);
create index if not exists tickets_org_idx on tickets (org_id);
create index if not exists ticket_messages_org_idx on ticket_messages (org_id);
create index if not exists community_questions_org_idx on community_questions (org_id);
create index if not exists community_answers_org_idx on community_answers (org_id);
create index if not exists events_org_idx on events (org_id);

-- Org-scoped retrieval: match_kb now filters by org so RAG never crosses tenants.
drop function if exists match_kb(vector(512), int, float);
create or replace function match_kb(
  query_embedding vector(512),
  p_org_id uuid,
  match_count int default 5,
  min_similarity float default 0
)
returns table (id uuid, title text, body text, category text, tags text[], similarity float)
language sql stable
as $$
  select kb.id, kb.title, kb.body, kb.category, kb.tags,
         1 - (kb.embedding <=> query_embedding) as similarity
  from kb_articles kb
  where kb.org_id = p_org_id
    and kb.status = 'published'
    and kb.embedding is not null
    and 1 - (kb.embedding <=> query_embedding) >= min_similarity
  order by kb.embedding <=> query_embedding
  limit match_count;
$$;

-- New users carry their org_id from app_metadata.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name, org_id)
  values (
    new.id,
    coalesce(new.raw_app_meta_data ->> 'role', 'customer'),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    nullif(new.raw_app_meta_data ->> 'org_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- NOTE: the app enforces org scoping in every query (server routes use the
-- service role, which bypasses RLS). Existing RLS policies remain; tightening
-- them to the JWT org_id is a follow-up hardening task.
