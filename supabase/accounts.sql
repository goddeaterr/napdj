-- ============================================================================
-- Student accounts, e-mail verification, password recovery and lesson credits.
--
-- HOW TO USE
--   Supabase → SQL Editor → New query → paste this whole file → Run.
--   Safe to run more than once.
--   Run supabase/schema.sql first if the bookings table does not exist yet.
--
-- Every table has row level security enabled with NO policies, so the
-- anon/publishable key can read nothing. Only the server's service_role key
-- reaches this data. Password hashes and token hashes never leave the server.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Accounts ───────────────────────────────────────────────────────────────
create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  -- Always stored lower-cased so sign-in is case-insensitive.
  email           text not null unique,
  -- scrypt hash: 'scrypt$<salt hex>$<key hex>'. Never a plain password.
  password_hash   text not null,

  name            text not null,
  phone           text,
  lang            text not null default 'en',

  email_verified  boolean not null default false,

  -- Bumped on password change and on "sign out everywhere", which instantly
  -- invalidates every session token issued before.
  token_version   integer not null default 1,

  -- Brute-force protection.
  failed_logins   integer not null default 0,
  locked_until    timestamptz,

  last_login_at   timestamptz
);

-- ── One-time e-mail links (verification + password reset) ──────────────────
create table if not exists public.auth_tokens (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid not null references public.users(id) on delete cascade,
  kind        text not null check (kind in ('verify', 'reset')),
  -- SHA-256 of the token that was e-mailed. The raw token exists only in the
  -- e-mail, so a database leak cannot be used to take over an account.
  token_hash  text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz
);

create index if not exists auth_tokens_hash_idx on public.auth_tokens (token_hash);
create index if not exists auth_tokens_user_idx on public.auth_tokens (user_id, kind);

-- ── Lesson ledger ──────────────────────────────────────────────────────────
-- The balance is the sum of the deltas, so every change keeps its own history
-- instead of overwriting a single counter.
create table if not exists public.lesson_entries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid not null references public.users(id) on delete cascade,

  -- Positive adds lessons, negative removes them.
  delta       integer not null,
  kind        text not null default 'adjustment'
              check (kind in ('purchase', 'free', 'used', 'adjustment')),
  note        text,
  created_by  text
);

create index if not exists lesson_entries_user_idx on public.lesson_entries (user_id, created_at desc);

-- ── Link bookings to accounts ──────────────────────────────────────────────
alter table public.bookings
  add column if not exists user_id uuid references public.users(id) on delete set null;

create index if not exists bookings_user_idx on public.bookings (user_id);

-- ── Lock everything down ───────────────────────────────────────────────────
alter table public.users          enable row level security;
alter table public.auth_tokens    enable row level security;
alter table public.lesson_entries enable row level security;

-- ── Rate limiting ──────────────────────────────────────────────────────────
-- Counters live in the database so they hold across serverless instances.
-- In-memory counters are per instance, which means a caller can walk around
-- them simply by being routed somewhere else.
create table if not exists public.rate_limits (
  key       text primary key,
  count     integer not null default 0,
  reset_at  timestamptz not null
);

alter table public.rate_limits enable row level security;

-- Atomic increment. Doing select-then-write from the server would race, and a
-- race in a rate limiter is a rate limiter that can be beaten by parallelism.
create or replace function public.bump_rate_limit(k text, window_seconds integer)
returns integer
language plpgsql
as $$
declare
  current_count integer;
begin
  insert into public.rate_limits (key, count, reset_at)
  values (k, 1, now() + make_interval(secs => window_seconds))
  on conflict (key) do update
    set count    = case when public.rate_limits.reset_at < now() then 1
                        else public.rate_limits.count + 1 end,
        reset_at = case when public.rate_limits.reset_at < now()
                        then now() + make_interval(secs => window_seconds)
                        else public.rate_limits.reset_at end
  returning count into current_count;

  return current_count;
end;
$$;
