# SaaSify — Multi-Tenant SaaS Dashboard

A production-ready SaaS starter with multi-tenancy, Stripe billing, and role-based access control.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (JWT sessions, credentials provider)
- **Billing:** Stripe (subscriptions, webhooks, billing portal)
- **Styling:** Tailwind CSS

## Features

- Multi-tenant architecture — each organization has fully isolated data
- Role-based access control — Owner, Admin, Member roles enforced at API level
- Stripe subscription billing — Free, Pro ($29/mo), Enterprise ($99/mo) plans
- Plan enforcement — project and member limits based on active plan
- Stripe webhook handler — handles checkout, renewals, cancellations
- Billing portal — customers manage their own subscriptions via Stripe
- Project management — create and track projects per organization
- Team management — invite members, assign roles

## Getting Started
```bash
git clone https://github.com/YOUR_USERNAME/saas-dashboard
cd saas-dashboard
npm install
cp .env.example .env  # fill in your values
npx prisma migrate dev
npm run dev
```

## Environment Variables

See `.env.example` for all required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — random secret for JWT signing
- `STRIPE_SECRET_KEY` — Stripe test secret key
- `STRIPE_WEBHOOK_SECRET` — from `stripe listen` output
- `STRIPE_PRO_PRICE_ID` / `STRIPE_ENTERPRISE_PRICE_ID` — Stripe price IDs

## Stripe Webhook (local dev)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Project Structure
src/
├── app/
│   ├── api/          # Route handlers (auth, orgs, billing, webhooks)
│   ├── dashboard/    # Protected dashboard pages
│   ├── login/        # Auth pages
│   └── register/
├── components/       # Sidebar, invite form, providers
└── lib/              # db, auth, stripe, plans, utils
prisma/
└── schema.prisma     # Full multi-tenant schema
