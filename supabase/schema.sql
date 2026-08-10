-- ============================================================================
-- Booking storage for the admin panel.
--
-- HOW TO USE
--   1. Create a free project at https://supabase.com
--   2. Open the project → SQL Editor → New query
--   3. Paste this whole file and press Run
--   4. Project Settings → API, copy:
--        Project URL          → SUPABASE_URL
--        service_role secret  → SUPABASE_SERVICE_ROLE_KEY
--      Add both to .env locally and to the Vercel project's
--      Environment Variables. Restart / redeploy.
--
-- The service_role key bypasses row level security. Keep it server-side only —
-- never put it in the frontend or commit it.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz,

  status         text not null default 'new'
                 check (status in ('new','contacted','confirmed','done','cancelled')),

  name           text not null,
  email          text not null,
  phone          text,

  plan           text not null,
  genre          text,

  session_date   date,          -- requested calendar date (no timezone)
  session_time   text,          -- requested slot, e.g. '18:00'
  no_preference  boolean not null default false,
  date_label     text,          -- human-readable, in the visitor's language

  message        text,
  lang           text,
  consent        boolean not null default false,

  note           text,          -- internal note written in the admin panel
  delivery       jsonb          -- outcome of the notification e-mails
);

create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_status_idx     on public.bookings (status);

-- Row level security ON with no policies: anonymous and authenticated keys can
-- read nothing. Only the service_role key used by the server has access.
alter table public.bookings enable row level security;
