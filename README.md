# Optimus Sphere Tech — POS System

A full-featured Point of Sale system for Optimus Sphere Tech, built with React and
backed by **Supabase (Postgres)**. Designed to run on several tills in one shop that
**share the same live data**, with authenticated access and a race-safe checkout.

## Features

- **Dashboard** — Today's revenue, top products, low stock alerts, payment breakdown
- **Point of Sale** — Product grid, cart management, discounts, multiple payment methods, atomic checkout
- **Products** — Add/edit/delete products with categories and stock tracking
- **Sales History** — Full transaction log with date filters and CSV export
- **Reports** — Sales analytics with period breakdowns (today / week / month / year / all time)
- **Settings** — Shop info, receipt customization, POS configuration

## Tech Stack

- React 18 + React Router v6
- **Supabase** — Postgres database, Auth, and Row Level Security
- Lucide React icons
- Google Fonts: Syne + DM Sans
- Deployed on Vercel (Create React App)

## How data works

All data lives in Supabase Postgres (no localStorage). The browser talks to it only
through `src/utils/store.js` — the single data layer — which maps the DB's snake_case
columns to the app's camelCase shapes.

Tables: `products`, `sales`, `sale_items` (header/detail), `settings` (single row), and
`users` (structure only, for future use). Every table is protected by **Row Level
Security** that requires an authenticated session, so nothing loads until a till signs in.

**Race-safe checkout:** completing a sale calls the `create_sale` Postgres function, which
runs the whole transaction atomically — it inserts the sale, snapshots each line item, and
decrements stock with a guarded update. If any item lacks stock (e.g. another till just
sold it), the entire sale rolls back, so two tills can never oversell the same unit.
Receipt numbers come from a Postgres sequence (`OST-0001`, …) so they're unique across tills.

## Access

A **single shared shop account** (Supabase Auth, email + password) signs every till in.
The session persists across reloads, so a till stays signed in across shifts; sign out from
the control next to the shop name in the sidebar. There are no per-user PINs or roles.

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project, then copy `.env.example` to `.env` and fill in your
   project URL and anon key (Supabase dashboard → Project Settings → API):
   ```
   REACT_APP_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```
3. In the Supabase SQL editor, run `supabase/schema.sql` to create the tables, the
   `create_sale` function, the receipt sequence, RLS policies, and seed data.
4. Create the shared shop user: Supabase dashboard → Authentication → Users →
   Add user → enter the shop email + password and tick **Auto Confirm User**.
5. Start the app and sign in with that account:
   ```bash
   npm start
   ```

> `.env` is gitignored — your Supabase keys are never committed.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo.
3. Framework: **Create React App** (auto-detected).
4. Add the `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` environment
   variables, then deploy.

## Mobile Responsive

Works on phone, tablet, and desktop. The sidebar collapses to a hamburger menu on mobile.
