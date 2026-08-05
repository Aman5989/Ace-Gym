-- init_supabase.sql
-- Run this in Supabase SQL editor. It creates members, payments, and admins tables and adds RLS policies.

-- Create extension for gen_random_uuid (if not present)
create extension if not exists "pgcrypto";

-- members table
create table if not exists public.members (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  joined_at timestamptz default now(),
  plan text default 'monthly',
  next_due_date date not null,
  status text default 'active'
);

-- payments table
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade,
  amount_cents int not null,
  currency text not null default 'INR',
  paid_for_date date not null,
  recorded_by text,
  recorded_at timestamptz default now(),
  note text
);

-- admins table (stores auth.uid of admin users)
create table if not exists public.admins (
  id uuid references auth.users(id),
  email text primary key
);

-- Enable RLS
alter table public.members enable row level security;
alter table public.payments enable row level security;

-- Allow anonymous inserts for registrations (only insert)
create policy if not exists "anon_insert_members" on public.members
  for insert
  using (true)
  with check (true);

-- Admins: allow select & update on members
create policy if not exists "admins_select_members" on public.members
  for select
  using (auth.uid() is not null and exists (select 1 from public.admins where id = auth.uid()));

create policy if not exists "admins_update_members" on public.members
  for update
  using (auth.uid() is not null and exists (select 1 from public.admins where id = auth.uid()));

-- Admins: payments select & insert
create policy if not exists "admins_select_payments" on public.payments
  for select
  using (auth.uid() is not null and exists (select 1 from public.admins where id = auth.uid()));

create policy if not exists "admins_insert_payments" on public.payments
  for insert
  with check (auth.uid() is not null and exists (select 1 from public.admins where id = auth.uid()));

-- Note: After creating an admin via Supabase Auth (Dashboard -> Authentication -> Users),
-- insert their UID into public.admins. Example:
-- insert into public.admins (id, email) values ('<AUTH_UID>', 'admin@example.com');

