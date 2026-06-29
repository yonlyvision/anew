-- Pre-signup interest applications.
-- Visitors apply (no password) -> admin approves/denies -> only an approved
-- email is allowed to actually create an account via /auth?mode=signup.

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

alter table public.applications enable row level security;
-- No anon/authenticated policies on purpose: all reads/writes go through
-- server functions using the service role (same pattern as verifications,
-- reports, contact_messages). The hook function below is SECURITY DEFINER
-- so it can read this table without needing its own policy.
-- service_role needs an explicit table grant (don't rely on schema default
-- privileges, which may be absent on a freshly-reset/self-hosted project).
grant all on public.applications to service_role;

create or replace function public.hook_require_approved_application(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_email text := lower(event->'user'->>'email');
  is_approved boolean;
begin
  select exists (
    select 1 from public.applications
    where lower(email) = signup_email
      and status = 'approved'
  ) into is_approved;

  if is_approved then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 400,
      'message', 'This email has not been approved yet. Submit an application first — you can create your account once it''s accepted.'
    )
  );
end;
$$;

grant execute
  on function public.hook_require_approved_application
  to supabase_auth_admin;

revoke execute
  on function public.hook_require_approved_application
  from authenticated, anon, public;
