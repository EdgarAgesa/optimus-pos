# Optimus Sphere Tech — POS System

A full-featured Point of Sale system for Optimus Sphere Tech, built with React and localStorage.

## Features

- **Dashboard** — Today's revenue, top products, low stock alerts, payment breakdown
- **Point of Sale** — Product grid, cart management, discounts, multiple payment methods
- **Products** — Add/edit/delete products with categories and stock tracking
- **Sales History** — Full transaction log with date filters and CSV export
- **Reports** — Manager-protected analytics with period breakdowns
- **Settings** — Shop info, PIN-based user management, receipt customization

## Default PINs

| User | PIN | Role |
|------|-----|------|
| Admin | `1234` | Manager |
| Cashier | `0000` | Cashier |

> ⚠️ Change these PINs in Settings before going live!

## Setup & Run

```bash
npm install
npm start
```

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework: **Create React App** (auto-detected)
4. Click Deploy — done!

## Tech Stack

- React 18
- React Router v6
- localStorage (no backend needed)
- Lucide React icons
- Google Fonts: Syne + DM Sans

## Data Persistence

All data is stored in the browser's `localStorage`:
- `os_products` — product catalog
- `os_sales` — transaction history
- `os_settings` — shop configuration
- `os_users` — user accounts & PINs

> Note: localStorage is per-device per-browser. For multi-device sync, a backend will be needed later.

## Mobile Responsive

Works on phone, tablet, and desktop. The sidebar collapses to a hamburger menu on mobile.
