# ACE々GYM

ACE々GYM is a production-oriented gym administration dashboard for managing members, membership plans, due dates, payments, and day-to-day gym operations. It is a private Next.js application backed by Supabase Auth and Supabase Postgres.

This README is intentionally written as an **AI-friendly project guide**. It explains the application’s purpose, boundaries, data flow, important files, business rules, development commands, and deployment expectations so future contributors or coding agents can work safely without rediscovering the architecture.

## Product scope

The application is designed for gym administrators. The primary workflow is:

> Sign in → find a member → record a payment or update membership information → review dues and collections from the dashboard.

The application currently supports the following capabilities:

| Capability | Current behavior |
|---|---|
| Administrator authentication | Supabase email/password authentication through `/login` |
| Password change | Available directly from the login page; verifies the current password and updates the new password without sending an email |
| Member management | Create, edit, search, filter, and delete member records |
| Membership plans | Monthly, Quarterly, Half Yearly, and Yearly plans |
| Payment logging | Record amount, method, date, and notes for a member |
| Due-date advancement | A successful payment advances `next_due_date` according to the member’s plan |
| Payment history | Load a member’s recorded payments on demand |
| Dashboard metrics | Total members, collected amount for the current month, due-today count, overdue count, and payment count |
| Reminders | Generate a WhatsApp reminder link from a member’s phone number and due-date information |
| Visual system | Premium dark glassmorphism interface with ambient gradients, staggered reveals, hover motion, and reduced-motion support |

Forgot-password email recovery is intentionally **not exposed in the current product flow**. Do not add SMTP requirements or email-reset UI unless the product owner explicitly requests it.

## Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3 with App Router |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, local UI primitives, Lucide icons |
| Forms | React Hook Form and Zod are available; current forms may also use controlled state |
| Notifications | Sonner toast notifications |
| Authentication | Supabase Auth with `@supabase/ssr` |
| Database | Supabase Postgres |
| Browser client | `lib/supabase.ts` using a cached `createBrowserClient` |
| Server auth | `lib/supabase-server.ts` and `proxy.ts` |
| Deployment | Netlify-compatible Next.js deployment |

## Quick start

### Requirements

Use Node.js 18 or newer. The repository includes `package-lock.json`; use npm for deterministic local setup.

### Install and run

```bash
cd Ace-Gym
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/admin`; unauthenticated users are redirected to `/login`.

### Validate before committing

```bash
npm run lint
npm run build
```

The project currently has a small set of non-blocking lint warnings related to image optimization, an existing internal navigation call, and the Tailwind configuration. New work should not introduce additional warnings or errors.

### Production run

```bash
npm run build
npm start
```

## Environment configuration

Create `.env.local` for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Only browser-safe Supabase values belong in this file. Never commit a `service_role` key, SMTP password, database password, or any other secret. The `.env.local` file must remain untracked.

For Netlify, configure the same two variables in the site’s build environment before triggering a new deploy. Because these are `NEXT_PUBLIC_` variables, they are embedded into the browser bundle at build time; changing them requires a fresh Netlify build.

## Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | Static redirect | Sends users to `/admin` |
| `/login` | Client page | Administrator sign-in and no-email password change |
| `/register` | Client page | Existing registration flow; use cautiously because the product is intended for private admin access |
| `/admin` | Dynamic protected page | Main dashboard |
| `/api/payments` | Dynamic API route | List and create payment records |
| `/api/register` | Dynamic API route | Existing registration endpoint |

The `/admin` route is protected by `proxy.ts`. Anonymous users are redirected to `/login`. Keep this protection intact when adding routes.

## Repository structure

```text
app/
  admin/page.tsx              Server-rendered dashboard composition
  api/payments/route.ts       Payment GET/POST API
  api/register/route.ts       Existing registration API
  login/page.tsx              Sign-in and no-email password-change UI
  register/page.tsx            Existing registration UI
  globals.css                 Global tokens, ambient effects, motion utilities
  layout.tsx                  Global layout and toast provider
  page.tsx                    Root redirect

components/
  auth/LoginForm.tsx           Legacy/auth form code; check usage before editing
  dashboard/
    DashboardHeader.tsx        Add member action, logout, dashboard branding
    MemberActions.tsx          Compact edit, payment, history, reminder, delete actions
    MembersTable.tsx            Searchable and filterable member list
    StatsCards.tsx              Dashboard metrics and collection cards
  forms/MemberForm.tsx          Create/edit member form and date defaults
  payments/
    PaymentDialog.tsx           Record-payment dialog
    PaymentHistory.tsx          On-demand member payment history
  ui/                           Shared shadcn-style primitives

lib/
  supabase.ts                   Cached browser Supabase client
  supabase-server.ts            Server-side Supabase client helper
  members.ts                    Member read helper and member typing boundary
  payments.ts                   Dashboard payment summary helper
  payment-utils.ts              Plan-aware date advancement utilities

types/
  member.ts                     Canonical Member interface
  payment.ts                    Canonical Payment interface and payment helpers

proxy.ts                        Auth/session protection for dashboard routes
public/                         Logos and static assets
AGENTS.md                       Repository contribution instructions
CLAUDE.md                       Additional project conventions
```

## Authentication model

The application uses Supabase Auth as the source of truth for administrator credentials. It does not maintain a custom password table.

### Sign-in

`app/login/page.tsx` calls `supabase.auth.signInWithPassword({ email, password })`. On success it routes the administrator to `/admin` and refreshes the application.

### Password change

Password changes are intentionally available from the login page rather than the dashboard. The administrator selects **Change password**, enters the account email, current password, new password, and confirmation, and submits the form. The application:

1. Re-authenticates with `signInWithPassword` using the current password.
2. Rejects short, mismatched, or unchanged passwords in the browser.
3. Calls `supabase.auth.updateUser({ password: newPassword })`.
4. Returns the user to the standard sign-in mode after success.

This flow does not send email. Avoid reintroducing email-recovery UI or SMTP dependencies unless explicitly requested.

### Route protection

`proxy.ts` refreshes the Supabase session from cookies and checks the authenticated user before allowing access to protected routes. Any new protected route should be included in the proxy matcher or protected through the same server-side session pattern.

## Member data model

The application expects a `public.members` table with fields equivalent to:

```sql
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  emergency_contact text,
  gender text,
  membership_plan text not null,
  monthly_fee numeric not null check (monthly_fee >= 0),
  join_date date not null,
  next_due_date date not null,
  notes text,
  created_at timestamptz not null default now()
);
```

The canonical TypeScript shape is in `types/member.ts`. Preserve the existing snake_case database field names when querying Supabase. Convert only at UI boundaries when there is a clear reason.

### Supported plans

The current plan values are represented in `types/member.ts` and consumed by `lib/payment-utils.ts`. Keep the values consistent across the member form, database rows, date calculations, and UI labels:

- `Monthly`
- `Quarterly`
- `Half Yearly`
- `Yearly`

New member creation pre-fills the join date and derives the first due date from the selected plan. Changing the join date or plan should keep the due-date preview consistent.

## Payment data model

The payment table is created in Supabase with the following schema:

```sql
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_method text not null default 'UPI',
  payment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments_select_all" on public.payments for select using (true);
create policy "payments_insert_all" on public.payments for insert with check (true);
create policy "payments_update_all" on public.payments for update using (true);
create policy "payments_delete_all" on public.payments for delete using (true);

create index if not exists idx_payments_member_id on public.payments (member_id);
create index if not exists idx_payments_payment_date on public.payments (payment_date desc);
```

The current policies are permissive. For production hardening, replace them with authenticated and role-appropriate policies after confirming the application’s authorization model. Do not silently change database security behavior in a UI-only task.

## Payment workflow

The daily payment workflow is intentionally short:

1. Search for a member in `MembersTable`.
2. Click the compact payment action in `MemberActions`.
3. Confirm or edit the amount, method, date, and note in `PaymentDialog`.
4. Submit the form.
5. `POST /api/payments` inserts the payment and updates the member’s `next_due_date`.
6. The dashboard refreshes and `PaymentHistory` can load the member’s records on demand.

`lib/payment-utils.ts` owns plan-aware due-date advancement. Keep business rules there rather than duplicating date arithmetic in multiple components.

### Payment API contract

`POST /api/payments` accepts a payload equivalent to:

```json
{
  "member_id": "uuid",
  "amount": 1500,
  "payment_method": "UPI",
  "payment_date": "2026-08-09",
  "notes": "August membership"
}
```

`GET /api/payments?member_id=<uuid>` returns payment history for one member. The API must validate the member ID, amount, and date, and it must preserve Supabase error details for server logs without exposing secrets to the browser.

## Dashboard data flow

`app/admin/page.tsx` is a server-rendered composition layer. It loads member data and payment summary data, then passes them into client components.

The expected flow is:

1. Request `/admin`.
2. `proxy.ts` verifies the Supabase session.
3. `getMembers()` loads members from Supabase.
4. `getPaymentSummary()` loads current-month payment totals and payment counts.
5. `StatsCards`, `DashboardHeader`, and `MembersTable` render the page.
6. Client mutations call Supabase or `/api/payments`, show a toast, and use `router.refresh()` to refresh server-rendered data.

Avoid adding a second competing global data-fetching layer unless there is a clear performance requirement. The current app intentionally uses server rendering for dashboard reads and client components for interactions.

## UI and design conventions

The visual language is a premium dark administration interface:

- Use the existing `ace-*` classes in `app/globals.css` for ambient backgrounds, glass surfaces, focus rings, reveals, shimmer, and reduced-motion behavior.
- Prefer the existing `components/ui` primitives over one-off controls.
- Keep high-frequency actions compact and close to the member row.
- Use clear hierarchy rather than excessive text or decorative elements.
- Maintain strong contrast and visible keyboard focus states.
- Preserve `prefers-reduced-motion` support when adding animation.
- Use `lucide-react` icons consistently with the existing dashboard.
- Avoid exposing technical details such as Supabase, SMTP, RLS, API keys, or internal route names in user-facing production copy.

## Development conventions for AI contributors

Before editing, inspect the relevant existing component and its caller. Do not assume a component is unused simply because another component looks similar; search the repository first.

For data changes, preserve the database field names and TypeScript types. Add or update helpers in `lib/` when a business rule is reused. Keep client-only code behind a `
use client` directives only where needed. Keep server-only Supabase helpers out of client components.

When changing forms, preserve fast keyboard and mouse workflows. Member creation and payment recording are high-frequency operations, so prefer sensible defaults, inline validation, and one clear submit action.

When changing authentication, never log passwords or tokens. Do not send credentials to custom APIs when Supabase Auth can perform the operation directly. Keep the no-email password-change behavior described above unless the product owner explicitly changes the requirement.

When changing the database, document the SQL in this README or in a migration file and explain any RLS implications. Never add secrets to source control.

Before completing a change, run:

```bash
npm run lint
npm run build
git status --short
```

## Deployment on Netlify

The production site is hosted at:

```text
https://ace-gym-fitness.netlify.app
```

A Netlify deploy should build from the repository’s `master` branch using the standard Next.js build command. Confirm that the deployment uses the latest GitHub commit and that the two public Supabase environment variables are configured in Netlify before diagnosing application behavior.

After deploying a UI change, verify the following routes manually:

- `/login` in a private browser window.
- `/login` → **Change password**, without submitting a real password change during visual checks.
- `/admin` after signing in.
- The record-payment dialog without saving a test payment unless a real record is intended.

If a deployment appears stale, perform a hard refresh, check the Netlify deploy commit, and confirm that the correct branch is connected. Public environment variables are build-time values, so changing them requires a new deploy.

## Troubleshooting

### Redirected back to `/login`

The session is missing or expired. Confirm the Supabase URL and public key, sign in again, and verify that the browser accepts Supabase auth cookies. Do not bypass `proxy.ts` to solve an authentication issue.

### Payment dialog fails to save

Check that `public.payments` exists, the `member_id` references an existing member, the amount is positive, and the RLS policies permit the requested operation. Inspect the server response from `/api/payments` and the Supabase logs; do not expose service credentials in browser logs.

### Dashboard totals look stale

The dashboard uses server-rendered reads. Successful client mutations should call `router.refresh()`. If the browser still shows old data, refresh the page and verify that the mutation actually returned success before changing the data-loading architecture.

### Production build fails after a UI change

Run `npm run lint` and `npm run build` locally. Resolve TypeScript errors first. Existing lint warnings are non-blocking, but new warnings should be reviewed rather than ignored.

## Security notes

The Supabase publishable/anon key is intended for browser use, but it is not an authorization mechanism by itself. Database access must be governed by Supabase Row Level Security. The current payment policies are permissive and should be tightened when the application gains multiple administrator roles or external users.

Never commit `.env.local`, service-role keys, SMTP credentials, raw passwords, recovery tokens, or private deployment configuration. Never include user passwords in toast messages, logs, analytics, URLs, or error reports.

The current password-change flow verifies the current password with Supabase Auth before calling `updateUser`. It does not send a reset email. If password recovery is added in the future, document the provider, redirect URLs, email templates, and abuse-rate limits before exposing it in the UI.

## Suggested future improvements

The next safe improvements are to add database migrations for the member and payment tables, tighten RLS policies around authenticated administrators, replace remaining raw `<img>` elements with optimized image components, add automated tests for date advancement and payment validation, and add a small audit log for payment edits and deletions.

## Git workflow

Use focused commits with clear messages:

```bash
git status --short
git add <specific-files>
git commit -m "Describe the change"
git push origin master
```

Do not commit generated build output, local environment files, screenshots, or credentials. Keep the working tree clean after a completed push.

## License

This repository currently has no license file. Add a formal `LICENSE` before distributing the project outside the owning organization.

## AI task checklist

When asked to modify this project, an AI contributor should:

1. Read `AGENTS.md`, `CLAUDE.md`, this README, and the relevant caller/component files.
2. Identify whether the requested change is server-side, client-side, database-related, or deployment-related.
3. Preserve Supabase Auth and the existing protected-route behavior.
4. Reuse current types, helpers, UI primitives, and motion classes.
5. Avoid adding email, SMTP, secrets, or new infrastructure unless explicitly requested.
6. Validate data changes against the documented schema and RLS behavior.
7. Run `npm run lint` and `npm run build`.
8. Review `git diff` and `git status --short` before committing.
9. Report exactly what changed, what was verified, and what was not tested with production data.

The README should be updated whenever a new route, table, business rule, environment variable, authentication behavior, or deployment requirement is introduced.
