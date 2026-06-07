# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm start          # dev server at localhost:3000
npm run build      # production build to build/
npm test           # Jest watch mode (react-scripts/CRA)
npm test -- --watchAll=false src/utils/format.test.js   # run a single test file once
```

This is a Create React App project (`react-scripts`). There are no tests in the repo yet; CRA's test runner picks up `*.test.js` files next to the code.

## Architecture

Single-page React app with **no backend** — all state lives in the browser's `localStorage`. Deployed to Vercel (`vercel.json` rewrites every path to `/` so React Router handles routing client-side).

Three layers:

1. **`src/utils/store.js`** — the entire data layer. Wraps `localStorage` reads/writes behind typed CRUD functions (products, sales, settings, users) plus `getDashboardStats()` for analytics aggregation. Owns the seed data and the four storage keys (`os_products`, `os_sales`, `os_settings`, `os_users`). `initStore()` seeds defaults only if a key is empty. Also exports the canonical `CATEGORIES` and `PAYMENT_METHODS` constants and the `uid()` id generator. **All persistence goes through here** — components never touch `localStorage` directly.

2. **`src/context/AppContext.js`** — global state via React Context (`useApp()` hook). Calls `initStore()` once on mount, then `refresh()` pulls products/sales/settings/stats into state. After any mutation (e.g. completing a sale), components call `refresh()` to re-sync. The current user is auto-logged-in as the cashier and persisted in `sessionStorage` (`os_user`); managers are verified by PIN.

3. **`src/pages/*`** — one component per route (`Dashboard`, `POS`, `Products`, `SalesHistory`, `Reports`, `Settings`), wired in `src/App.js`. `src/components/UI.js` is a shared inline-styled component kit (`Btn`, `Input`, `Select`, `Modal`, `Card`, `StatCard`, `Badge`, `Alert`, `PinModal`, `ConfirmDialog`, `SearchBar`, etc.). `Receipt.js` and `Sidebar.js` are the other shared components.

### Key conventions

- **Styling is entirely inline `style={{}}` objects** keyed off CSS custom properties defined in `src/index.css` (`var(--teal)`, `var(--navy)`, `var(--radius)`, `var(--font-display)`, etc.). There is no CSS framework or CSS modules. Reuse the existing design tokens rather than hardcoding colors/spacing. Responsive behavior is done with `<style>` tags containing media queries injected into components.

- **Currency is KES** throughout. Amounts are stored as **whole-number integers** (e.g. `89999` = KES 89,999, no decimals). Always format with `formatKES()` from `src/utils/format.js`; never render raw numbers.

- **Role gating uses PINs, not auth.** Two roles: `manager` and `cashier`. Manager-only areas (Reports, sensitive Settings) gate behind `<PinModal>` / `verifyPin()` which checks `user.role === 'manager'`. Default PINs are seeded in `store.js` (`SEED_USERS`): manager `1234`, cashier `0000`.

- **Sales are immutable records.** `addSale()` assigns a sequential `receiptNo` (`OST-0001`), timestamps it, and decrements product stock via `decrementStock()` in the same call. Cart line items snapshot `name`/`price` at sale time so historical receipts stay correct even if the product later changes.

- **Note:** `PinModal` in `UI.js` uses `require('../context/AppContext')` / `require('../utils/store')` inline (CommonJS) to dodge circular imports — match that pattern if you touch it rather than converting to top-level ESM imports.
