# QPG — Course & Membership Platform (Frontend)

A Next.js 15 platform combining an online course/membership site with a live AI chat experience powered by the companion [`ai/`](../ai) service. Built by [The Fabcode](https://thefabcode.com) — see the [root README](../README.md) for the full picture.

> 📌 This repository is published as a portfolio reference. It is not intended to be run as-is — see [License](#license).

## What it does

- **Authentication** — NextAuth with credentials and social login, account linking, email verification, and password reset flows.
- **Video course platform** — course catalog, per-video and per-course progress tracking, milestone-gated content access, and secure signed video delivery via Bunny.net.
- **Payments & subscriptions** — Authorize.Net integration (card, Apple Pay, Google Pay), subscription lifecycle management, transaction history, and webhook-driven order handling. Tax calculated via TaxJar.
- **AI chat & "Plant Clinic"** — a live chat widget (Socket.IO) and diagnostic image-upload form that talk directly to the [`ai/`](../ai) backend for real-time cultivation support.
- **Headless CMS content** — marketing pages, blog, and hero sections driven by Sanity, synced into the app's own database for performance and resilience.
- **Security & compliance** — route-level auth middleware, rate limiting, security-event logging, cookie consent, and age/content gating.

## Architecture

```
src/
├── app/              # Next.js App Router — pages + API routes
├── components/       # Auth, courses, chat, payments, blog, video, UI
├── db/                # Drizzle schema (per-domain: auth, courses, chat, security, …)
├── lib/
│   ├── auth/          # NextAuth configuration
│   ├── authorize-net/ # Payment gateway integration
│   ├── bunny/          # Signed video streaming
│   ├── sanity/         # CMS client & content sync
│   ├── taxjar/          # Tax calculation
│   └── services/        # Domain service layer consumed by API routes
├── hooks/              # Course/video progress, chat connection, consent
├── sections/            # Marketing page sections
├── stores/               # Zustand client state
└── middleware/            # Fine-grained course access control
```

API routes stay thin; business logic lives in `lib/services/*`, one service per domain. Route-level protection is enforced both at the edge (`middleware.ts`) and per-route for finer-grained subscription/course access checks.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM + PostgreSQL · NextAuth · Zustand · Sanity CMS · Authorize.Net · TaxJar · Bunny.net · Socket.IO

## License

Copyright © 2026 The Fabcode. All rights reserved. Provided for viewing and reference only — no rights to copy, modify, distribute, or use this code are granted. See the [root LICENSE](../LICENSE).
