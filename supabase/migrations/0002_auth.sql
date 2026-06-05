-- 0002_auth.sql — Supabase Auth: profiles + roles. Run after 0001_init.sql.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'agent', 'admin')),
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles self read" on profiles;
create policy "profiles self read" on profiles for select using (auth.uid() = id);
-- Agents/admins read all profiles via server routes using the service-role key.

-- Auto-create a profile when an auth user is created. Role comes from
-- app_metadata.role (set for demo/seeded accounts), defaulting to 'customer'.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_app_meta_data ->> 'role', 'customer'),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Link tickets to the customer who opened them (powers "My Tickets").
alter table tickets add column if not exists requester_id uuid references auth.users(id) on delete set null;
alter table tickets add column if not exists requester_email text;
create index if not exists tickets_requester_idx on tickets (requester_id);
