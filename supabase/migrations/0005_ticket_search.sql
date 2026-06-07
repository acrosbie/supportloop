-- 0005_ticket_search.sql — semantic "similar tickets" for the agent copilot.
-- Run after 0004_tenancy.sql, then `npm run seed` to embed resolved tickets.

alter table tickets add column if not exists embedding vector(512);
create index if not exists tickets_embedding_idx on tickets using hnsw (embedding vector_cosine_ops);

-- Org-scoped nearest-neighbour over resolved tickets, excluding the current one.
create or replace function match_tickets(
  query_embedding vector(512),
  p_org_id uuid,
  exclude_id uuid,
  match_count int default 3,
  min_similarity float default 0.5
)
returns table (id uuid, subject text, body text, intent text, status text, similarity float)
language sql stable
as $$
  select t.id, t.subject, t.body, t.intent, t.status,
         1 - (t.embedding <=> query_embedding) as similarity
  from tickets t
  where t.org_id = p_org_id
    and t.id <> exclude_id
    and t.status in ('resolved', 'deflected')
    and t.embedding is not null
    and 1 - (t.embedding <=> query_embedding) >= min_similarity
  order by t.embedding <=> query_embedding
  limit match_count;
$$;
