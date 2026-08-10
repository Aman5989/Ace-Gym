# ACE々GYM

ACE々GYM is a professional gym management system for member registration, membership administration, payment collection, financial period verification, role-based access, and branded membership documentation. It is built for the day-to-day workflow of a gym owner and trainer: quickly find members, maintain accurate membership records, collect payments, review financial activity, and keep the dashboard operationally simple.

This README is an **AI-friendly project guide**. It documents the product scope, current business rules, data model, security boundaries, UI conventions, Supabase migrations, development workflow, and deployment expectations. Future contributors should read this file together with `AGENTS.md`, `CLAUDE.md`, and the relevant caller/component files before making changes.

## Product overview

The core workflow is:

> Sign in → review the dashboard → add or update a member → record a payment → monitor dues and collections → verify and archive the month as an administrator.

The application currently includes the following capabilities:

| Area | Current behavior |
|---|---|
| Authentication | Supabase email/password sign-in through `/login`. |
| Password change | A no-email password-change flow is available from the login page. It verifies the current password before updating the new password. |
| Role-based access | Admins can manage members, view payment information, manage roles, close collection periods, and manage the dashboard image. Trainers can manage and view members without access to financial administration. |
| Member management | Create, edit, search, filter, and delete member records. |
| Member profile | Stores full name, phone, father’s name, address, gender, timing, membership plan, total fee, join date, next due date, and notes. |
| Membership plans | Monthly, Quarterly, Half Yearly, and Yearly plans with plan-aware due-date advancement. |
| Payment logging | Record UPI, Cash, or UPI + Cash payments. UPI + Cash stores the two components separately and calculates the total automatically. |
| Payment history | View individual member payment history and the broader admin payment ledger. |
| Collection periods | Track the active collection month, verify and close a period, and retain historical monthly payment records without deleting transactions. |
| Dashboard metrics | Shows member count, current-month collection totals, due and overdue information, and payment counts. |
| Reminders | Generates a WhatsApp reminder link using a member’s phone number and due-date information. |
| Membership PDF | Generates a branded client-side PDF using `jspdf`, including member details, ACE々GYM branding, gym terms, and record information. |
| Dashboard image | Admins can upload, replace, and remove the gym dashboard image. The image preview is compact, square, right-aligned, and uses icon-only controls. |
| Visual system | Premium dark glassmorphism interface with gradients, ambient effects, motion, compact actions, responsive dialogs, and reduced-motion support. |

Forgot-password email recovery is intentionally **not part of the current product flow**. Do not add SMTP requirements or email-reset UI unless the product owner explicitly requests that behavior.

## Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3 with App Router and TypeScript |
| Runtime | React 19 |
| Styling | Tailwind CSS 4 and project-specific styles in `app/globals.css` |
| UI primitives | Local shadcn-style components under `components/ui` |
| Icons | Lucide React |
| Forms and validation | React Hook Form and Zod are available; current flows also use controlled state where appropriate |
| Notifications | Sonner |
| Authentication | Supabase Auth with `@supabase/ssr` |
| Database and storage | Supabase Postgres and Supabase Storage |
| PDF generation | jsPDF in the browser |
| Deployment | Netlify-compatible Next.js deployment |

## Quick start

### Requirements

Use Node.js 18 or newer. The repository uses pnpm during current development; npm can also be used when the lockfile and package-manager workflow are intentionally aligned.

```bash
cd Ace-Gym
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/admin`; unauthenticated users are redirected to `/login`.

### Validation commands

Run the following before committing application changes:

```bash
pnpm lint
pnpm build
```

The project currently has a small number of non-blocking lint warnings related primarily to raw image elements. New work should not introduce additional warnings or any errors.

To run the production server locally:

```bash
pnpm build
pnpm start
```

## Environment configuration

Create `.env.local` for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Only browser-safe Supabase values belong in this file. Never commit `.env.local`, service-role keys, database passwords, SMTP credentials, or raw account passwords. The public Supabase URL and publishable/anon key are not substitutes for Row Level Security.

For Netlify, configure the same two `NEXT_PUBLIC_` variables in the site’s build environment before deploying. Because these values are embedded at build time, changing them requires a new Netlify build.

## Routes and APIs

| Route | Type | Purpose |
|---|---|---|
| `/` | Static redirect | Sends users to `/admin`. |
| `/login` | Client page | Sign-in and no-email password change. |
| `/register` | Client page | Public/member registration flow when enabled. |
| `/admin` | Dynamic protected page | Main dashboard for authenticated users. |
| `/api/register` | Dynamic API route | Validates and creates registration/member records. |
| `/api/payments` | Dynamic API route | Lists and creates payment records. |
| `/api/collection-period` | Dynamic API route | Reads and manages collection-period state, including admin close/reset operations. |
| `/api/user-roles` | Dynamic API route | Admin role-management operations. |
| `/api/dashboard-image` | Dynamic API route | Admin-only dashboard image upload and removal. |

`proxy.ts` protects the dashboard session. Anonymous users should be redirected to `/login`. Keep protected-route behavior intact when adding new pages or APIs.

## Role-based access control

Supabase Auth remains the source of truth for identity. Application roles are stored in the `public.user_roles` table and resolved through the authorization helpers in `lib/authorization.ts`.

| Role | Allowed responsibilities |
|---|---|
| Admin | Manage members, view payment information, inspect the financial ledger, manage user roles, verify and close collection periods, and upload or remove the dashboard image. |
| Trainer | View, search, filter, and download member PDFs from a focused table showing Member, Phone, Address, Timing, Total Fee, Join Date, Plan, Due Date, and Due Status. Trainers cannot edit or delete members and do not receive payment collection, financial ledger, role-management, month-close, or dashboard-image controls. The header identifies the page as **Trainer Dashboard**. |

The initial administrator account is configured in Supabase Auth and should not be hard-coded into client components. Role checks must happen server-side for sensitive APIs and should also be reflected in the UI for a clear experience.

When changing RBAC, avoid querying `user_roles` from a policy that recursively references `user_roles`. Use a security-definer helper or a server-side authorization boundary to prevent the previously encountered infinite-recursion policy failure.

## Authentication and password changes

`app/login/page.tsx` uses Supabase Auth email/password authentication. The password-change flow is intentionally available directly from the login page and does not send an email:

1. The user selects **Change password**.
2. The current password is verified with `signInWithPassword`.
3. The browser validates the new password and confirmation.
4. The application calls `supabase.auth.updateUser({ password: newPassword })`.
5. The form returns to normal sign-in mode after success.

Never log passwords or tokens. Do not send credentials through a custom API when Supabase Auth can perform the operation directly.

## Member data model

The canonical application interface is `types/member.ts`. The current profile contract has replaced the old email and emergency-contact fields with father’s name and address.

Representative columns in `public.members` are:

```sql
id uuid primary key default gen_random_uuid(),
full_name text not null,
phone text not null,
father_name text,
address text,
gender text,
timing text,
membership_plan text not null,
monthly_fee numeric not null check (monthly_fee >= 0),
join_date date not null,
next_due_date date not null,
notes text,
created_at timestamptz not null default now()
```

The database key `monthly_fee` is retained for compatibility with the existing schema and code paths, but all current user-facing copy calls it **Total Fee**. Do not rename the physical column casually without a coordinated migration and full application update.

The current member form and registration flow collect:

| Field | Purpose |
|---|---|
| Full name | Member’s legal/display name. |
| Phone | Primary contact number and WhatsApp reminder target. |
| Father’s name | Replaces the retired email-address field in the member profile. |
| Address | Replaces the retired emergency-contact field. |
| Gender | Member profile information. |
| Timing | Morning or Evening workout preference. |
| Membership plan | Monthly, Quarterly, Half Yearly, or Yearly. |
| Total Fee | Amount agreed for the selected membership. Stored under `monthly_fee` for compatibility. |
| Join date | Membership start date. |
| Next due date | Current payment due date, advanced according to the selected plan after successful payment. |
| Notes | Additional administrative information. |

Supported plans are `Monthly`, `Quarterly`, `Half Yearly`, and `Yearly`. Keep these values consistent across the form, database, payment utilities, and UI labels.

## Payment and collection workflows

The payment system is designed to reduce data-entry time while keeping every transaction available for later review.

### Recording a payment

1. Search for a member in `MembersTable`.
2. Open the compact payment action in `MemberActions`.
3. Select the payment method and confirm the date and amount.
4. For **UPI + Cash**, enter the UPI and Cash components separately. The dialog calculates the combined total.
5. Submit the payment.
6. `POST /api/payments` saves the transaction and advances the member’s `next_due_date` according to the plan.
7. The dashboard refreshes and the member’s `PaymentHistory` can load the updated records.

Payment methods currently supported by the application and database constraints include `UPI`, `Cash`, `UPI + Cash`, `Half UPI + Half Cash` for compatibility with earlier records, `Card`, and `Bank Transfer` where enabled by the existing schema.

### Payment data model

The core table is:

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
```

The payment-component migration adds fields for separately tracked UPI and Cash values where the deployed schema supports them. Preserve the total amount and component values when updating payment behavior; historical transaction details must not be discarded.

### Financial archives and month close

Payments are never reset by deleting rows. Collection periods provide a readable monthly layer over the master transaction history:

- The open period represents the current collection month.
- The admin ledger displays individual payment details and monthly totals.
- Only an administrator can verify and close the active period.
- Closing a month preserves all payment rows and creates historical visibility for future review.
- The reset/next-period operation is intentionally admin-only and should not be triggered automatically by trainers or ordinary UI interactions.

If the dashboard reports that no open collection period is available, verify the collection-period migration and create/open the period through the admin workflow rather than deleting payment history.

### API contracts

A payment creation request is equivalent to:

```json
{
  "member_id": "uuid",
  "amount": 1500,
  "payment_method": "UPI",
  "payment_date": "2026-08-09",
  "notes": "August membership"
}
```

For a mixed payment, the request may also include the UPI and Cash component values supported by the current route implementation. `GET /api/payments?member_id=<uuid>` returns member history. Validate member IDs, positive amounts, dates, and payment methods at the API boundary.

`lib/payment-utils.ts` owns plan-aware due-date advancement. Keep date arithmetic and payment business rules in shared helpers rather than duplicating them in multiple components.

## Dashboard data flow

`app/admin/page.tsx` is the server-rendered dashboard composition layer. It loads members, payment summaries, collection-period information, role state, and the saved gym image, then passes data into client components.

The normal flow is:

1. The browser requests `/admin`.
2. `proxy.ts` refreshes and checks the Supabase session.
3. Member and payment helpers read the current server-side data.
4. `StatsCards`, `DashboardHeader`, `MembersTable`, and admin-only financial components render the dashboard.
5. Client interactions call Supabase or the application APIs.
6. Successful mutations show a toast and use `router.refresh()` to refresh server-rendered values.

Avoid introducing a second global data-fetching layer unless a clear performance requirement exists. Server-rendered reads and client-side mutations are intentional in the current architecture.

## Membership PDF

Admins can download a professional membership document from the member actions menu. The action calls `downloadMemberPdf()` from `lib/member-pdf.ts` and generates the file in the browser with jsPDF.

The document includes:

| Section | Information |
|---|---|
| Branding | The ACE々GYM wordmark with a Noto Sans JP-backed **ACE々Shubham** treatment and **7717728536** in the upper-left header, plus **For Men & Women** in the upper-right. |
| Membership ID | Displays beside the Admission/Renewal controls and generates `ACE々` + the first four alphabetic characters of the member name + the last two digits of the phone number. |
| Member profile | Full name, phone, father’s name, address, gender, and other current profile values. |
| Membership details | Plan, Total Fee, join date, next due date, and relevant notes; the previous Membership No. field is replaced by Membership ID in the header. |
| Header layout | The ACE々GYM wordmark and **BUILT not BORN** tagline use compact spacing while preserving the existing form structure. |
| Admission state | The Admission checkbox is intentionally left empty without a checkmark symbol. |
| Footer | The Generated on date appears beneath the Member Signature area. |
| Rules and terms | Non-refundable fee policy, one workout per day, footwear requirements, property conduct, loss/theft disclaimer, and cleanliness requirements. |
| Footer | Administrative record and gym-terms information. |

The PDF is a client-side document generator. It does not upload member information to an external document service and does not modify the database. The embedded `public/assets/NotoSansJP-Regular.otf` font is registered with jsPDF so the ACE々 symbol renders correctly in exported documents. Keep the PDF layout professional, preserve the ACE々GYM branding, and update the `rules` content in `lib/member-pdf.ts` if the gym’s terms change.

## Dashboard image management

The admin dashboard supports a gym visual stored in the Supabase Storage bucket configured by the dashboard-image route. Admins can:

- Upload a new image from the device.
- Replace the current image.
- Remove the current image, which clears the saved setting and attempts to remove the stored asset.

The current UI uses a compact right-aligned square image tile above two icon-only controls. The controls retain `aria-label` and `title` metadata even though their visible text has been removed. The image API is admin-protected; do not expose upload or delete operations to trainers.

## UI and design conventions

The visual language is a premium dark administration interface:

- Reuse the `ace-*` classes in `app/globals.css` for glass surfaces, ambient gradients, focus rings, reveals, shimmer, and reduced-motion behavior.
- Prefer the existing components under `components/ui` instead of one-off primitives.
- Keep high-frequency member and payment actions compact and close to the relevant row.
- Maintain strong contrast, visible keyboard focus, and responsive behavior.
- Preserve `prefers-reduced-motion` support when adding animation.
- Use Lucide icons consistently.
- Keep dialogs scrollable on short screens and avoid increasing CRUD time with unnecessary steps.
- Do not expose Supabase, SMTP, RLS, API keys, or implementation details in production-facing copy.

## Repository structure

```text
app/
  admin/page.tsx                    Protected server-rendered dashboard
  api/collection-period/route.ts    Collection-period and close/reset API
  api/dashboard-image/route.ts      Admin image upload/removal API
  api/payments/route.ts             Payment GET/POST API
  api/register/route.ts             Registration/member creation API
  api/user-roles/route.ts           Admin role-management API
  login/page.tsx                    Sign-in and password-change page
  register/page.tsx                 Registration page
  globals.css                       Global design tokens and motion utilities

components/
  admin/RoleManagement.tsx          Admin role controls
  auth/LoginForm.tsx                Authentication form implementation
  dashboard/DashboardHeader.tsx     Branding, image controls, member action, logout
  dashboard/MemberActions.tsx       Edit, payment, history, reminder, PDF, delete actions
  dashboard/MembersTable.tsx        Searchable and filterable member list
  dashboard/MonthCloseButton.tsx    Admin collection-period verification/close action
  dashboard/StatsCards.tsx           Dashboard metrics and collection summaries
  forms/MemberForm.tsx              Admin create/edit member form
  payments/AdminPaymentLedger.tsx   Admin financial ledger and archives
  payments/PaymentDialog.tsx        Record-payment dialog
  payments/PaymentHistory.tsx       Member payment history
  public/RegistrationForm.tsx       Public registration form
  ui/                               Shared UI primitives

lib/
  authorization.ts                  Current-user and role authorization helpers
  gym-settings.ts                   Dashboard settings and image reads
  member-pdf.ts                     Branded membership PDF generator
  members.ts                        Member reads and related helpers
  payment-utils.ts                  Plan-aware due-date logic
  payments.ts                       Payment summaries and financial reads
  supabase.ts                       Browser Supabase client
  supabase-server.ts                Server-side Supabase client

types/
  member.ts                         Canonical Member interface
  payment.ts                        Canonical Payment interface

supabase/
  ace-gym-setup.sql                 Base setup/reference SQL
  migrations/                       Incremental schema migrations
  repair-*.sql                      Targeted repair scripts for deployed schemas

proxy.ts                             Session refresh and protected-route behavior
public/                              Logos, icons, and static assets
```

## Supabase migrations

Apply migrations in order through the Supabase SQL Editor or the project’s chosen migration workflow. The repository currently documents these incremental changes:

| Migration | Purpose |
|---|---|
| `20260809000000_add_member_timing.sql` | Adds Morning/Evening member timing support. |
| `20260809010000_add_collection_periods.sql` | Adds monthly collection-period tracking. |
| `20260809020000_add_payment_type.sql` | Adds payment-type support. |
| `20260809030000_add_payment_components.sql` | Adds separate payment-component tracking for mixed payments. |
| `20260809040000_add_role_management.sql` | Adds application role management. |
| `20260809050000_allow_member_upi_cash.sql` | Allows the custom UPI + Cash payment method. |
| `20260809060000_add_dashboard_image.sql` | Adds dashboard image settings/storage support. |
| `20260809070000_add_member_profile_fields.sql` | Adds `father_name` and `address` to `public.members`. |

Additional repair scripts document deployed-schema fixes:

- `supabase/repair-payment-method-constraint.sql` allows the custom mixed payment method while preserving older compatible methods.
- `supabase/repair-rbac-and-open-period.sql` addresses role and collection-period deployment issues.

The member profile migration has been applied and verified in the Ace-Gym Supabase project. The verification query confirmed `address` and `father_name` as `text` columns.

### RLS and security

The original payment setup includes permissive policies for development. These policies should be tightened for a production multi-role deployment so authenticated users and admin/trainer capabilities are enforced at the database boundary as well as in application code. Do not silently change RLS behavior in a UI-only task; document and test any policy change.

## Deployment on Netlify

The current production site is:

```text
https://ace-gym-fitness.netlify.app
```

Netlify should build from the repository’s `master` branch using the standard Next.js build process. Before diagnosing a stale deployment:

1. Confirm the Netlify deploy references the latest GitHub commit.
2. Confirm both public Supabase environment variables are configured.
3. Trigger a fresh deploy after changing build-time environment values.
4. Hard-refresh the browser and test `/login` and `/admin`.

After a UI deployment, manually verify sign-in, password-change form presentation, the admin dashboard, member CRUD, the payment dialog, payment history, the admin ledger, month-close controls, PDF download, and dashboard image upload/remove behavior. Do not create test financial records unless a real test transaction is intended.

## Troubleshooting

### Redirected to `/login`

The session may be missing or expired. Confirm the Supabase URL and public key, sign in again, and verify that the browser accepts Supabase auth cookies. Do not bypass `proxy.ts` to solve an authentication issue.

### Payment dialog fails to save

Verify that `public.payments` exists, the member ID references an existing member, the amount is positive, the payment method is allowed by the database constraint, and the relevant RLS policies permit the operation. Inspect the API response and Supabase logs without exposing secrets.

### No open collection period is available

Check the collection-period migration and admin setup. Open or create the period through the admin workflow. Do not delete payment rows to solve a period-state issue.

### Financial history is missing

Payment rows should remain in the master `payments` table after month close. Verify that the ledger query includes closed periods and that the collection-period relationship is correct. The reset control must reset the active metrics/period state, not erase historical transactions.

### Dashboard image does not update

Confirm that the current user is an admin, the `gym-assets` storage bucket exists with the expected access rules, and the `gym_settings` row is writable. After a successful mutation, the UI calls `router.refresh()` to refresh server-rendered dashboard data.

### Production build fails

Run:

```bash
pnpm lint
pnpm build
```

Resolve TypeScript and compilation errors first. Existing image optimization warnings are non-blocking, but new warnings should be reviewed.

## Development rules for AI contributors

Before editing, inspect the relevant component, caller, route, type, migration, and helper. Search the repository before assuming a component is unused.

For data changes, preserve snake_case database names and the canonical TypeScript interfaces. Keep business rules in shared `lib/` helpers. Keep server-only Supabase helpers out of client components.

For forms, preserve fast keyboard and mouse workflows. Member creation and payment recording are high-frequency operations, so use sensible defaults, inline validation, clear errors, and one obvious submit action.

For authentication and authorization, never log credentials or tokens. Protect sensitive APIs server-side and preserve the Admin/Trainer boundary.

For database changes, add a migration or repair script, explain RLS implications, and never commit secrets. Every new route, table, business rule, environment variable, authentication behavior, or deployment requirement should be reflected in this README.

## Git workflow

Use focused commits and push the `master` branch:

```bash
git status --short
git add <specific-files>
git commit -m "Describe the change"
git push origin master
```

Do not commit generated build output, local environment files, screenshots, credentials, or unrelated dependency artifacts.

## Current status

The current implementation includes the premium UI, member and payment workflows, monthly financial archives, Admin/Trainer RBAC, admin-only member deletion, trainer read-only member PDF access, the focused Trainer Dashboard table, a non-blocking login submit state with direct dashboard redirect, branded PDF export, profile-field replacement, dashboard image upload/removal, and the associated Supabase migrations. The application has been repeatedly validated with ESLint and a successful production build.

The most important remaining production-hardening opportunity is to review and tighten permissive database RLS policies for the final multi-role deployment, followed by automated tests for payment validation, due-date advancement, collection-period transitions, and authorization boundaries.

## License

This repository currently has no license file. Add a formal `LICENSE` before distributing the project outside the owning organization.

## AI task checklist

When asked to modify this project, an AI contributor should:

1. Read `AGENTS.md`, `CLAUDE.md`, this README, and the relevant implementation files.
2. Identify whether the request is client-side, server-side, database-related, security-related, or deployment-related.
3. Preserve Supabase Auth, protected routes, and Admin/Trainer authorization behavior.
4. Reuse current types, helpers, UI primitives, storage conventions, and motion classes.
5. Avoid adding email, SMTP, secrets, or new infrastructure unless explicitly requested.
6. Validate schema changes against the documented migrations and RLS behavior.
7. Run `pnpm lint` and `pnpm build`.
8. Review `git diff` and `git status --short` before committing.
9. Report what changed, what was verified, and what was not tested with production data.
10. Update this README when the product scope, schema, business rules, routes, or deployment requirements change.

_Last updated for the current Ace-Gym implementation._

## References

[1]: https://nextjs.org/docs "Next.js Documentation"
[2]: https://supabase.com/docs "Supabase Documentation"
[3]: https://docs.netlify.com/frameworks/next-js/overview/ "Netlify Next.js Documentation"
[4]: https://github.com/parallax/jsPDF "jsPDF Repository"

---

**Project:** ACE々GYM

**Repository:** `Aman5989/Ace-Gym`

**Production:** [ace-gym-fitness.netlify.app](https://ace-gym-fitness.netlify.app)

*Built for fast, clear, and accountable gym operations.*

### Notes for contributors

The application’s database field `monthly_fee` is intentionally retained internally while the product language uses **Total Fee**. The member profile UI and PDF use **Father’s Name** and **Address**; legacy `email` and `emergency_contact` member fields are no longer part of the canonical application contract.

The dashboard’s image controls are intentionally icon-only. Keep their `aria-label` and `title` attributes when adjusting the visual design so the compact controls remain accessible.

The no-email password-change flow is intentional. Do not add password-reset email dependencies or SMTP configuration unless the product owner changes that requirement.

The master payment ledger is the source of truth. Month-end verification must preserve historical payment rows and only close or reset the active collection period.

### Final verification reminder

A completed contribution should leave the working tree clean except for intentionally excluded local artifacts and should include a clear commit message. For schema changes, confirm the migration has been applied in Supabase as well as committed to the repository.

---

_End of project guide._

## Additional implementation notes

The dashboard image API uses the `gym-assets` storage bucket and the `gym_settings` row with `id = 'main'`. The admin-only delete operation clears the setting and attempts to remove the stored object. If storage permissions prevent object deletion, the UI setting is still cleared and the failure should be investigated through Supabase logs rather than exposed as a credential or implementation detail.

The payment collection UI intentionally separates UPI and Cash components for mixed payments. Any future payment-method change must update the form, API validation, database constraint, ledger display, dashboard totals, and this README together.

The member PDF is generated locally in the browser. Changes to profile fields must be reflected in `types/member.ts`, `MemberForm`, `RegistrationForm`, `/api/register`, `MembersTable`, and `lib/member-pdf.ts` as one coherent change.

The current project is suitable for continued feature work, but production launch should include a final RLS review, role-boundary verification, and a controlled test of month-end close and historical ledger visibility.

## End of README

ACE々GYM is maintained as a private business application. Keep operational details, credentials, and personal member data out of source control.
