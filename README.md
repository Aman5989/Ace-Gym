# Ace-Gym — Static frontend for Supabase-powered registration + admin UI

This folder contains a lightweight, free-hostable static frontend (registration page + admin UI) that works with a Supabase backend (Postgres + Auth + RLS). It is intended to be deployed to Netlify or GitHub Pages. The site does not include any secret keys — you must provide your Supabase project URL and anon key.

Features
- Public registration form: creates a member record and sets next_due_date to the first day of the next calendar month (India timezone assumption for display).
- Admin UI: sign in with Supabase Auth (admin user) to view members, record payments, and advance next_due_date.

How to use
1. Create a Supabase project (free) and run the SQL in sql/init_supabase.sql (or paste it into the Supabase SQL editor).
2. Create an admin Auth user in Supabase (Dashboard → Authentication → Users). Note their UID and add it to the public.admins table (see SQL comments).
3. Set the following environment values in Netlify or replace placeholders in frontend/js/app.js:
   - SUPABASE_URL: your Supabase Project URL (e.g. https://xyzcompany.supabase.co)
   - SUPABASE_ANON_KEY: public anon key (from Project settings → API)
4. Deploy the frontend directory (this repo's frontend/) to Netlify or GitHub Pages. On Netlify set Build command: none (or leave), Publish directory: frontend

Security notes
- Do NOT put the Supabase service_role key in the frontend. Keep it secret.
- The SQL uses Row Level Security (RLS). Add admin users to the public.admins table (their auth UID) so they can read/write members/payments.

If you want, I can also push server-side seed scripts or help you run the SQL in Supabase.
