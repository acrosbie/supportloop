-- 0006_rls.sql — defense-in-depth RLS. Run after 0005.
--
-- The application reads/writes exclusively via the service role, which BYPASSES
-- RLS — so enabling RLS here does not change app behavior. It locks the remaining
-- tables against any direct anon/authenticated client access (kb_articles,
-- community_*, and profiles already had RLS from 0001/0002).

alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table events enable row level security;
alter table eval_runs enable row level security;
alter table canned_responses enable row level security;
alter table organizations enable row level security;

-- Org-scoped reads for authenticated staff (should any future client read
-- directly). Anonymous users have no org_id in the JWT, so they match nothing.
-- Service-role writes are unaffected.
drop policy if exists "tickets org read" on tickets;
create policy "tickets org read" on tickets
  for select using ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid = org_id);

drop policy if exists "ticket_messages org read" on ticket_messages;
create policy "ticket_messages org read" on ticket_messages
  for select using ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid = org_id);

drop policy if exists "organizations member read" on organizations;
create policy "organizations member read" on organizations
  for select using ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid = id);
