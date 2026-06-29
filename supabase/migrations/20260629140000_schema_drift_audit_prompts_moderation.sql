-- Schema-drift repair.
-- The app code references three things that were never in the migration
-- history (they were created ad-hoc in the old Lovable database): an admin
-- audit log, profile prompts, and a few moderation columns on profiles.
-- Without them, admin actions (approve/deny applications, ban/pause, etc.)
-- and profile editing/discovery fail at runtime. Idempotent — safe to re-run.

-- 1) profiles: moderation columns -------------------------------------------
alter table public.profiles
  add column if not exists is_banned  boolean not null default false,
  add column if not exists admin_notes text,
  add column if not exists banned_at  timestamptz,
  add column if not exists banned_by  uuid references auth.users(id) on delete set null;

-- 2) admin_audit_log --------------------------------------------------------
-- Written/read only through server functions using the service role, so no
-- anon/authenticated policies (same pattern as reports/contact_messages).
create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  target_type text not null,
  target_id   text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
grant all on public.admin_audit_log to service_role;
create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

-- 3) profile_prompts --------------------------------------------------------
-- Read/written with the *user* client (RLS applies). Any member can read
-- prompts (they show on profiles in discovery); you can only write your own.
create table if not exists public.profile_prompts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  prompt_key text not null,
  answer     text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, prompt_key)
);
alter table public.profile_prompts enable row level security;
grant select, insert, update, delete on public.profile_prompts to authenticated;
grant all on public.profile_prompts to service_role;

drop policy if exists "Prompts readable by authenticated" on public.profile_prompts;
create policy "Prompts readable by authenticated" on public.profile_prompts
  for select to authenticated using (true);

drop policy if exists "Members insert own prompts" on public.profile_prompts;
create policy "Members insert own prompts" on public.profile_prompts
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Members update own prompts" on public.profile_prompts;
create policy "Members update own prompts" on public.profile_prompts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Members delete own prompts" on public.profile_prompts;
create policy "Members delete own prompts" on public.profile_prompts
  for delete to authenticated using (user_id = auth.uid());

drop trigger if exists profile_prompts_set_updated_at on public.profile_prompts;
create trigger profile_prompts_set_updated_at before update on public.profile_prompts
  for each row execute function public.set_updated_at();
