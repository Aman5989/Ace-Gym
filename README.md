# Ace-Gym

A Next.js 13+ (App Router) admin dashboard for managing gym members, subscriptions and dues. Built with React, TypeScript, Tailwind CSS and Supabase for authentication and database.

This README replaces the scaffold README and provides a detailed explanation of repository structure, code flow, environment setup, and developer guidance so an AI or new developer can understand and work on the project.

---

## Quick start

Prerequisites
- Node 18+ (recommended)
- npm / pnpm / yarn
- A Supabase project (for database + auth)

Install and run locally

```bash
# install
npm install

# dev
npm run dev

# build & production
npm run build
npm start
```

Open http://localhost:3000 — the app redirects to `/admin`.

Environment variables (required)
- NEXT_PUBLIC_SUPABASE_URL — Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon/public API key

Important: These are public keys used by the browser client. Do not commit private/service_role keys to the repo. Use environment variables in your deployment platform.

---

## High-level overview

- Framework: Next.js (App Router) + React + TypeScript
- Styling: Tailwind CSS (+ UI primitives under components/ui)
- Backend: Supabase (Auth + Postgres)
- Purpose: Admin dashboard to manage gym members, subscriptions, dues and membership lifecycle.

Key runtime behaviors
- A server-side "proxy" (proxy.ts) protects `/admin` routes by checking Supabase auth and redirecting anonymous users to `/login`.
- Server components fetch members from Supabase (lib/members.ts). Client components (forms, interactive UI) use createBrowserClient for mutations and auth actions.
- After client-side mutations (insert/update/delete), router.refresh() is used to re-fetch server-rendered data.

---

## Folder structure and important files

Root
- package.json — scripts & dependencies
- next.config.ts — Next configuration
- tailwind.config.ts, postcss.config.mjs — tailwind tooling
- proxy.ts — request middleware-like function that checks Supabase auth and redirects unauthenticated access to `/login` (applies to `/admin` via config.matcher)

app/
- page.tsx — root page that redirects to `/admin`.
- layout.tsx — global layout; renders children and Toaster component.
- admin/page.tsx — Admin dashboard entry. Fetches members and renders DashboardHeader, StatsCards, MembersTable.

components/
- dashboard/
  - DashboardHeader.tsx — header with Add Member and Logout actions. Opens MemberForm in a Dialog and calls supabase.auth.signOut() to sign out.
  - StatsCards.tsx — cards showing Total Members, Due Today, Overdue (computed from members array).
  - MembersTable.tsx — searchable, filterable members table, with per-row MemberActions (edit/delete) component.
- forms/
  - MemberForm.tsx — client-side form for creating/updating members. Uses Supabase client to insert/update rows.
- ui/
  - UI primitive components (Button, Input, Dialog, Card, Badge, Select, etc.) referenced throughout the app (import paths: `@/components/ui/*`).

lib/
- supabase.ts — client factory using `@supabase/ssr` `createBrowserClient` (cached browser client). Used by client components.
- members.ts — `getMembers()` helper used by server components to fetch members from `members` table.

types/
- Member type definition (referenced as `@/types/member`). The code expects fields like `id`, `full_name`, `phone`, `email`, `emergency_contact`, `gender`, `membership_plan`, `monthly_fee`, `join_date`, `next_due_date`, `notes`, `created_at`.

utils/
- Utility helpers (if any) used across the codebase.

public/
- Static assets (images, icons) served by Next

Other files
- AGENTS.md, CLAUDE.md — small docs
- package-lock.json

---

## Data flow & request lifecycle (text diagram)

1. Client requests `/` -> `app/page.tsx` immediately redirects to `/admin`.
2. Request to any `/admin` route triggers proxy.ts (configured via `config.matcher`).
   - proxy.ts creates a server Supabase client (createServerClient) using env vars and `request.cookies`.
   - It calls `supabase.auth.getUser()`.
   - If no authenticated user: returns a redirect to `/login`.
   - If authenticated: continues to render the requested page.
3. Server-rendered Admin page (`app/admin/page.tsx`) calls `getMembers()` from `lib/members.ts`.
   - `getMembers()` uses `lib/supabase.createClient()` (browser-like factory) to call `supabase.from('members').select('*').order('created_at', {ascending:false})` and returns Member[] to the page.
4. Admin page renders components (DashboardHeader, StatsCards, MembersTable) with the `members` array.
5. User actions:
   - Add Member: DashboardHeader opens MemberForm (client). MemberForm inserts the record using the Supabase browser client and calls `router.refresh()` on success.
   - Edit Member: MemberActions likely opens MemberForm pre-filled. MemberForm calls `.update(...).eq('id', member.id)` and `router.refresh()`.
   - Logout: DashboardHeader calls `supabase.auth.signOut()`, then navigates to `/login` and refreshes.

Notes on client/server separation
- Server: page.tsx, admin/page.tsx fetch data and render HTML before client hydration.
- Client: interactive forms and UI components use `"use client"` and the browser Supabase client.

---

## Supabase schema (inferred & recommended)

Table: members
- id uuid PRIMARY KEY DEFAULT gen_random_uuid()
- full_name text NOT NULL
- phone text NOT NULL
- email text
- emergency_contact text
- gender text
- membership_plan text NOT NULL -- Monthly | Quarterly | Half Yearly | Yearly
- monthly_fee numeric NOT NULL
- join_date date NOT NULL
- next_due_date date NOT NULL
- notes text
- created_at timestamptz DEFAULT now()

SQL example:
```sql
create extension if not exists pgcrypto;

create table members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  emergency_contact text,
  gender text,
  membership_plan text not null,
  monthly_fee numeric not null,
  join_date date not null,
  next_due_date date not null,
  notes text,
  created_at timestamptz default now()
);
```

Important points
- The code compares `next_due_date` to `new Date()` so store dates in a format Postgres/Supabase returns as ISO strings (date or timestamptz both work).
- `created_at` is used to order members in `lib/members.ts`.

---

## How to run and test common tasks

1) Start dev server
```bash
npm install
npm run dev
```

2) Add a member (manual flow)
- Open `/admin` as an authenticated user.
- Click "Add Member", fill the form and submit.
- On success the UI shows a toast and the page refreshes (server data re-fetched).

3) Authenticate with Supabase
- Use Supabase Auth (email / magic link or other providers) — make sure your Supabase project allows sign-ups or manually insert test user records.
- For local testing, you can set session cookies manually or use a sign-in flow implemented in the app (look for `/login` route or auth components).

4) Logging out
- Click Logout in the DashboardHeader. This will call `supabase.auth.signOut()` and redirect to `/login`.

---

## Implementation notes & recommendations

- Central Supabase usage
  - `lib/supabase.ts` currently constructs a browser client using `createBrowserClient` and caches it. Server-side code uses `createServerClient` directly in proxy.ts. Keep both while ensuring server-only service keys are never exposed.

- Security
  - Use Supabase Row Level Security (RLS) and policies to restrict operations. Ensure insert/update/delete are limited to authenticated and authorized users only.
  - Keep service_role or admin keys off the client.

- Error handling
  - Data access functions often log errors and return empty values. Consider throwing or returning error details for better debugging and testability.

- Types & validation
  - Ensure `types/member.ts` contains a definitive `Member` interface and export it to keep types consistent.
  - Add validation (e.g., Zod) for incoming form data before inserting into the DB.

- Tests
  - Add unit tests for `lib/members.ts` (mock Supabase client), and integration tests for form behaviors.

---

## Troubleshooting & common gotchas

- Missing env vars
  - If NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing, the Supabase client initialization will crash. Add them to `.env.local` or your host configuration.

- Auth/redirect loops
  - The proxy uses cookies from the incoming request. If auth cookies are not set or Supabase session is invalid, users will be redirected to `/login`.

- Date comparisons
  - The app uses `new Date(member.next_due_date) < new Date()` to determine overdue status. If `next_due_date` is not parsable, the comparison may behave unexpectedly. Store dates in ISO format.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/some-change`
3. Run lint and tests (when added)
4. Open a PR with a clear description and link to any related issues

Guidelines
- Keep components small and typed.
- Add tests for new logic.
- Avoid committing secrets.

---

## License

This repository currently has no LICENSE file. Add a LICENSE (MIT, Apache-2.0, etc.) to clarify usage. If you want, I can add a LICENSE file in a follow-up commit.

---

## Next steps I can take for you
- Add this README as a commit to the default branch (I will replace the current README) — done on your confirmation.
- Create a CONTRIBUTING.md, LICENSE, and a sample `.env.example`.
- Add a `supabase.sql` migration file with the `members` table DDL.

---

If you want additional details (e.g., full diagram in ASCII, supabase policies, or to add a `.env.example` and SQL migration), tell me which and I will add them.
