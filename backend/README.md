# Bazaarnagar — Backend (Prototype 1)

REST API for the Bazaarnagar mini-store / product-catalog platform.
**Node.js + Express + TypeScript + MongoDB (Mongoose).**

Implements the SRS: seller auth, store profiles, product CRUD with **plan limit
enforcement**, **rule-based product moderation**, public shop/search,
**impression tracking** (shop/product views + WhatsApp clicks), local **image
uploads** (multer), and a full admin panel API.

## Setup

```bash
cd backend
npm install
cp .env.example .env        # then edit values (esp. MONGODB_URI, JWT_SECRET)
npm run seed                # wipe + load sample data (admin + 3 sellers)
npm run dev                 # http://localhost:5000  (watch mode)
```

You need MongoDB running — either a local `mongod` (default URI
`mongodb://127.0.0.1:27017/bazaarnagar`) or a MongoDB Atlas connection string in
`MONGODB_URI`.

Other scripts: `npm run build` (compile to `dist/`), `npm start` (run compiled),
`npm run typecheck`.

### Seeded logins
- **Admin:** `admin@bazaarnagar.com` / `admin123` (from `.env`)
- **Sellers:** `ayesha@example.com`, `bilal@example.com`, `sana@example.com` — password `password123`

## API overview

Base URL: `/api`. Auth via `Authorization: Bearer <token>`.

### Auth
| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/auth/signup` | – | Seller signup → `{ token, seller }` |
| POST | `/auth/login` | – | Seller login → `{ token, seller }` |
| GET | `/auth/me` | seller/admin | Current identity |
| POST | `/admin/login` | – | Admin login → `{ token, admin }` |

### Public (customer, no login)
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/public/search?q=&category=&city=&area=` | Product search (only public-searchable, approved, active) |
| GET | `/public/stores/:slug` | Public shop (increments shop views) |
| GET | `/public/stores/:storeId/products?publicOnly=true` | Store products |
| GET | `/public/products/:id` | Product detail + store (increments product views) |
| POST | `/public/products/:id/whatsapp-click` | Track a WhatsApp inquiry click |

### Seller (requires seller token)
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/seller/me` | Seller profile |
| GET / PUT | `/seller/store` | Get / create-update store profile |
| GET | `/seller/dashboard` | Dashboard metrics |
| GET | `/seller/products` | List own products |
| POST | `/seller/products` | Create (enforces plan limits + runs moderation) |
| PUT | `/seller/products/:id` | Update (re-moderates) |
| DELETE | `/seller/products/:id` | Delete |
| POST | `/upload` (field `image`) | Upload one image → `{ url }` |
| POST | `/upload/multiple` (field `images`) | Upload up to 8 → `{ urls }` |

### Admin (requires admin token)
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/admin/overview` | Platform totals |
| GET | `/admin/sellers` | All sellers |
| PATCH | `/admin/sellers/:id` | Update status / plan / subscription |
| GET / POST | `/admin/sellers/:id/payments` | Payment history / record payment |
| GET | `/admin/stores` | All stores |
| PATCH | `/admin/stores/:id` | Approve / deactivate store |
| GET | `/admin/products` | All products (+ store) |
| PATCH | `/admin/products/:id/moderation` | Set moderation status |
| DELETE | `/admin/products/:id` | Remove product |

Uploaded images are served from `/uploads/<file>`.

## Connecting the frontend

Response shapes match `frontend/src/lib/types.ts`. To switch the frontend off
mock data:

1. In `frontend/.env.local` set `NEXT_PUBLIC_API_BASE=http://localhost:5000/api`.
2. Replace the method bodies in `frontend/src/lib/api.ts` with `fetch` calls to
   the endpoints above (and send the JWT for seller/admin calls).

## Design notes

- **Plan limits** live in `src/lib/plans.ts` (mirrors the frontend constants).
- **Moderation** is a conservative keyword filter in `src/lib/moderation.ts`:
  safe products auto-approve, risky ones are flagged for admin review. Admin
  always has final control via the moderation endpoint.
- Every model serialises `_id` → `id` and strips `passwordHash` (`src/models/_base.ts`).
