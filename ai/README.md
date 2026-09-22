# Q — AI Cultivation Assistant (Backend)

A TypeScript/Express backend powering **Q**, a conversational AI assistant built for the QPG cultivation platform. This service is one half of a larger product built by [The Fabcode](https://thefabcode.com) — see the [root README](../README.md) for the full picture.

> 📌 This repository is published as a portfolio reference. It is not intended to be run as-is — see [License](#license).

## What it does

- **Conversational AI chat** powered by Google Gemini, including a dedicated vision model for analyzing uploaded plant photos (species validation, symptom/damage detection).
- **Guided diagnostic workflow** — a structured triage → clarifying questions → solution pipeline for plant health issues, rather than a single freeform prompt.
- **Grounded answers via retrieval** — a curated library of cultivation protocols (watering, nutrients, environment, pest management, drying & curing) stored in PostgreSQL with `pgvector`, retrieved by embedding similarity so responses stay accurate and on-brand.
- **Real-time chat delivery** over Socket.IO for the live chat widget on the site.
- **Facebook Messenger integration** — the same assistant moderates and responds to posts/comments on the brand's Facebook page, with signature-verified webhooks and thread-aware conversation tracking.
- **Production-oriented plumbing** — fail-fast environment validation on boot, rate limiting, structured logging (Winston), file-upload validation, scheduled cleanup jobs, and graceful shutdown handling.

## Architecture

```
src/
├── controllers/     # HTTP request handling
├── routes/          # Express route definitions
├── services/        # Core business logic (AI, DB, diagnostics, chat, Facebook, sockets)
│   └── diagnostic/  # Triage → questions → solution pipeline
├── middleware/       # Auth, validation, upload, webhook signature checks
├── data/             # Cultivation protocol knowledge base
├── types/            # Shared TypeScript types
└── utils/            # Logging and shared helpers
```

Services are layered rather than monolithic: the AI layer (Gemini), persistence layer (Postgres/pgvector), and orchestration layer (diagnostic + chat services) are independent and composed at the entry point.

## Tech stack

Node.js · TypeScript · Express · Socket.IO · LangChain / `@langchain/google-genai` (Gemini) · PostgreSQL + pgvector · Winston · Multer · Docker

## License

Copyright © 2026 The Fabcode. All rights reserved. Provided for viewing and reference only — no rights to copy, modify, distribute, or use this code are granted. See the [root LICENSE](../LICENSE).
