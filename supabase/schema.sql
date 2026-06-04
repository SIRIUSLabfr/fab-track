-- ============================================================
-- System. Health Tracker — Supabase Schema
-- Einmalig im Supabase SQL Editor ausführen
-- (Dashboard → SQL Editor → New query → einfügen → Run)
-- ============================================================

-- Eine Zeile pro Nutzer. Spiegelt das App-Datenmodell:
--   days         = { "2026-06-04": { meals, exercises }, ... }
--   config       = { progression, customFoods }
--   measurements = [ { date, weight, waist, sleep, energy }, ... ]
create table if not exists public.app_data (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  days         jsonb not null default '{}'::jsonb,
  config       jsonb not null default '{}'::jsonb,
  measurements jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

-- Row Level Security: jeder sieht und ändert NUR seine eigenen Daten
alter table public.app_data enable row level security;

drop policy if exists "Users manage own data" on public.app_data;
create policy "Users manage own data"
  on public.app_data
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Hinweis zur Registrierung:
-- Standardmäßig verlangt Supabase E-Mail-Bestätigung. Für eine
-- private Single-User-App kannst du das abschalten unter
-- Authentication → Providers → Email → "Confirm email" deaktivieren.
-- Dann funktioniert Login sofort ohne Bestätigungsmail.
-- ============================================================
