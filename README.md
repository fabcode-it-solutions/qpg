# QPG — AI-Powered Cultivation Learning Platform

A full-stack platform combining an online course/membership site with a custom AI cultivation assistant. Built end-to-end by **The Fabcode** for a real client, this repository is shared publicly as a **portfolio reference** showcasing architecture, integration depth, and code quality.

> 📌 **This is a reference copy, not a runnable build.** Core wiring (database connections, environment/config bootstrapping, and auth configuration) has been intentionally removed before publishing. See [License](#license) below.

## What's inside

This repo contains two coordinated services from the same product:

| Project | Description |
|---|---|
| [`ai/`](./ai) | Node.js + TypeScript backend powering "Q", a conversational AI cultivation assistant (Google Gemini, PostgreSQL + pgvector, Facebook Messenger integration) |
| [`site/`](./site) | Next.js 15 course & membership platform (auth, video courses, subscriptions/payments, CMS-driven marketing pages) that consumes the AI assistant |

## Highlights

- **Custom AI diagnostic assistant** — multi-step triage/diagnosis workflow, image-based plant health analysis via Gemini vision, and a curated knowledge base retrieved through vector similarity search (pgvector).
- **Real-time chat** — Socket.IO powering a live chat widget embedded in the site, backed by the AI service.
- **Full commerce stack** — subscriptions and one-time payments via Authorize.Net (including Apple Pay / Google Pay), tax calculation via TaxJar, and webhook-driven order lifecycle handling.
- **Video course platform** — secure, signed video delivery through Bunny.net with per-user progress tracking and milestone-gated access.
- **Headless CMS** — marketing and content pages driven by Sanity, synced into the app's own database for performance.
- **Production-minded engineering** — layered service architecture, fail-fast configuration validation, rate limiting, structured logging, Dockerized deployment, and route-level auth middleware.

## Tech stack

**Backend / AI:** Node.js, TypeScript, Express, Socket.IO, LangChain, Google Gemini, PostgreSQL + pgvector, Docker

**Frontend / Platform:** Next.js 15, React 19, TypeScript, Tailwind CSS, Drizzle ORM, NextAuth, Zustand

**Integrations:** Sanity CMS, Authorize.Net, TaxJar, Bunny.net

## About The Fabcode

This project reflects the kind of work we deliver for clients: AI integrations, full-stack platforms, and production-grade infrastructure. If you're looking for a team to build something similar, [get in touch](https://thefabcode.com).

## License

Copyright © 2026 The Fabcode. All rights reserved.

This source code is made available **for viewing and reference purposes only**. No permission is granted to copy, modify, distribute, sublicense, publish, sell, or otherwise use this code or any portion of it. See [LICENSE](./LICENSE) for full terms.
