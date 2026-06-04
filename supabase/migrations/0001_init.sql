-- 0001_init.sql — SupportLoop schema (Supabase Postgres + pgvector)
-- Run this once in the Supabase SQL editor (or via the CLI) before `npm run seed`.

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Knowledge base (the RAG store)
-- ---------------------------------------------------------------------------
create table if not exists kb_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'General',
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'draft')),
  source text not null default 'seed' check (source in ('seed', 'ticket', 'community')),
  created_from_ticket_id uuid,
  created_from_question_id uuid,
  embedding vector(512),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Support tickets + conversation
-- ---------------------------------------------------------------------------
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  channel text not null default 'chat',
  status text not null default 'open' check (status in ('open', 'assisted', 'resolved', 'deflected')),
  intent text,
  urgency text check (urgency in ('low', 'medium', 'high')),
  queue text,
  sentiment text,
  was_deflected boolean not null default false,
  was_ai_assisted boolean not null default false,
  csat int check (csat between 1 and 5),
  is_hero boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  role text not null check (role in ('customer', 'agent', 'ai')),
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Community Q&A
-- ---------------------------------------------------------------------------
create table if not exists community_questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'answered')),
  has_kb_gap boolean not null default false,
  embedding vector(512),
  created_at timestamptz not null default now()
);

create table if not exists community_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references community_questions(id) on delete cascade,
  body text not null,
  source text not null check (source in ('ai', 'user')),
  accepted boolean not null default false,
  upvotes int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Event log (powers the ops dashboard + today/session lens)
-- ---------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  ticket_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Eval runs (Quality surface)
-- ---------------------------------------------------------------------------
create table if not exists eval_runs (
  id uuid primary key default gen_random_uuid(),
  total int not null default 0,
  grounded int not null default 0,
  passed int not null default 0,
  avg_similarity double precision not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists kb_articles_embedding_idx
  on kb_articles using hnsw (embedding vector_cosine_ops);
create index if not exists tickets_created_at_idx on tickets (created_at);
create index if not exists tickets_status_idx on tickets (status);
create index if not exists events_created_at_idx on events (created_at);
create index if not exists events_type_idx on events (type);

-- ---------------------------------------------------------------------------
-- Semantic search over published KB (cosine similarity)
-- ---------------------------------------------------------------------------
create or replace function match_kb(
  query_embedding vector(512),
  match_count int default 5,
  min_similarity float default 0
)
returns table (
  id uuid,
  title text,
  body text,
  category text,
  tags text[],
  similarity float
)
language sql stable
as $$
  select
    kb.id,
    kb.title,
    kb.body,
    kb.category,
    kb.tags,
    1 - (kb.embedding <=> query_embedding) as similarity
  from kb_articles kb
  where kb.status = 'published'
    and kb.embedding is not null
    and 1 - (kb.embedding <=> query_embedding) >= min_similarity
  order by kb.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- RLS (demo-simple): anon may READ published KB + community. All writes go
-- through server route handlers using the service-role key, which bypasses RLS.
-- This is intentional for a demo — do not treat it as production auth.
-- ---------------------------------------------------------------------------
alter table kb_articles enable row level security;
alter table community_questions enable row level security;
alter table community_answers enable row level security;

drop policy if exists "anon read published kb" on kb_articles;
create policy "anon read published kb" on kb_articles
  for select using (status = 'published');

drop policy if exists "anon read community questions" on community_questions;
create policy "anon read community questions" on community_questions
  for select using (true);

drop policy if exists "anon read community answers" on community_answers;
create policy "anon read community answers" on community_answers
  for select using (true);
