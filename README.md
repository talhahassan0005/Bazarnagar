# Bazaarnagar — Frontend (Prototype 1)

Mobile-friendly mini-store / product-catalog builder for WhatsApp & Instagram sellers.
Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**.

This is the **frontend only**. It currently runs against an in-memory mock data
layer; a separate **Node.js / Express + MongoDB** backend will replace the mock
layer in the next phase (see [Backend integration](#backend-integration)).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
```

## Routes

| Area     | Route                                      | Description                          |
| -------- | ------------------------------------------ | ------------------------------------ |
| Public   | `/`                                        | Landing page                         |
| Public   | `/search`                                  | Product search + filters             |
| Public   | `/store/[slug]`                            | Public shop page                     |
| Public   | `/store/[slug]/product/[productId]`        | Product detail + WhatsApp inquiry    |
| Auth     | `/login`, `/signup`                        | Seller authentication                |
| Seller   | `/dashboard`                               | Dashboard (metrics, store link)      |
| Seller   | `/dashboard/store`                         | Create / edit store profile          |
| Seller   | `/dashboard/products` `…/new` `…/[id]/edit`| Product management                   |
| Seller   | `/dashboard/analytics`                     | Views & WhatsApp click analytics     |
| Seller   | `/dashboard/plan`                          | Plan & subscription                  |
| Admin    | `/admin/login`                             | Admin sign in                        |
| Admin    | `/admin`                                   | Overview + moderation queue          |
| Admin    | `/admin/sellers` `/stores` `/products`     | Management tables                    |
| Admin    | `/admin/moderation`                        | Product moderation queue             |
| Admin    | `/admin/plans`                             | Plan & subscription management       |

## Project structure

```
src/
├─ app/
│  ├─ (public)/        # landing, search, store, product detail  (PublicNavbar + Footer)
│  ├─ (auth)/          # login, signup                           (centered layout)
│  ├─ dashboard/       # seller area                             (SellerShell sidebar)
│  └─ admin/
│     ├─ login/        # standalone admin login
│     └─ (panel)/      # admin pages                             (AdminShell sidebar)
├─ components/
│  ├─ ui/              # generic primitives: Button, Input, Card, Badge, Modal, Toggle…
│  ├─ layout/          # Logo, navbars, Footer, sidebars, DashboardShell, SellerShell, AdminShell
│  ├─ domain/          # ProductCard, ProductForm, StoreProfileForm, StoreHeader,
│  │                   #   WhatsAppButton, StatCard, DataTable, status badges…
│  └─ auth/            # AuthCard
├─ hooks/
│  └─ useAsync.ts      # tiny data-fetching hook (loading/data/error)
└─ lib/
   ├─ types.ts         # shared domain types (Seller, Store, Product, Plan…)
   ├─ constants.ts     # plans, categories, cities, moderation metadata
   ├─ utils.ts         # cn, formatPrice, slugify, buildWhatsAppLink…
   ├─ mockData.ts      # sample sellers / stores / products
   └─ api.ts           # API client abstraction (mock today → Express tomorrow)
```

### Component philosophy

Every page composes small, reusable components. Pages hold layout + data wiring;
all visual / interactive logic lives in `components/`. Domain components are
data-shape driven (they take a `Product` / `Store` / `Plan`), so they work
identically with mock data or real API responses.

## Backend integration

All data access flows through **`src/lib/api.ts`**. To connect the real backend:

1. Set `NEXT_PUBLIC_API_BASE` in `.env.local` (e.g. `http://localhost:5000/api`).
2. Replace each method body in `lib/api.ts` with a `fetch` to the matching
   Express endpoint. The return types (`lib/types.ts`) stay the same, so **no
   component or page needs to change.**

The mock data shapes already mirror the intended MongoDB documents.
