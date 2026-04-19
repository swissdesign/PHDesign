# P. Heiniger Design Studio

**Premium design services for Swiss and international clients — Andermatt, Schweiz.**

This repository is the production website and booking engine for P. Heiniger Design Studio. It operates as a conversion-focused sales funnel and portfolio showcase, built to be robust, coherent, and maintainable.

---

## Running Locally

**Prerequisites:** Node.js ≥ 20 (see `.nvmrc`)

```bash
# Install dependencies
npm install

# Copy environment file and fill in credentials
cp .env.example .env.local

# Start development server
npm run dev
# → http://localhost:4321/
```

> **Note:** Without real Google Sheets credentials, main pages will throw `GOOGLE_CMS_SHEET_ID missing`. Legal pages (`/de/impressum`, `/de/agb`, `/de/datenschutz`) are static and always load.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values. All variables are required in production.

See [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) for the step-by-step setup guide (GCP, Sheets, Payrexx, Vercel).

---

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for a full technical reference covering:
- Astro/React hybrid architecture
- Google Sheets CMS data flow
- URL routing and view synchronisation
- Booking and contact API flows
- Language system (German-first)
- Component map

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro](https://astro.build) v5 (hybrid/SSR mode) |
| UI | React 18 (client islands) |
| Styling | Tailwind CSS (brand token system) |
| Hosting | [Vercel](https://vercel.com) (Serverless) |
| CMS | Google Sheets via service account |
| Payments | [Payrexx](https://payrexx.com) (Swiss gateway) |
| Language | German-first (DE/EN/FR/IT routing) |

---

## Key Commands

```bash
npm run dev        # Dev server at localhost:4321
npm run build      # Production build (requires env vars)
npm run preview    # Preview production build locally
```

---

## Repository Structure

```
src/
├── components/
│   ├── react/               # React SPA core
│   │   ├── App.tsx          # Root SPA with view state + URL sync
│   │   ├── types.ts         # Shared TypeScript types
│   │   └── components/      # All UI components
│   └── astro-islands/       # Astro-specific island wrappers
├── layouts/
│   └── BaseLayout.astro     # HTML shell, meta tags, fonts
├── lib/
│   └── i18n.ts              # Language type + LANGS constant
├── pages/
│   ├── index.astro          # Root redirect → /de/
│   ├── [lang]/
│   │   ├── index.astro      # Main app page (loads CMS, renders SPA)
│   │   ├── work.astro       # /de/work entry point
│   │   ├── services.astro   # /de/services entry point
│   │   ├── impressum.astro  # Legal: Impressum
│   │   ├── datenschutz.astro # Legal: Datenschutz
│   │   └── agb.astro        # Legal: AGB
│   └── api/                 # Serverless API endpoints
│       ├── contact.ts       # POST /api/contact → Sheets
│       ├── booking.ts       # POST /api/booking → Payrexx + Sheets
│       └── payments/        # Payrexx webhook handler
└── server/
    ├── adapters/            # External service clients
    │   └── googleSheets.ts  # Google Sheets read/write
    ├── lib/
    │   └── env.ts           # Typed env var access
    └── modules/
        ├── cms.ts           # CMS data fetching + normalisation
        └── booking.ts       # Booking flow business logic
```

---

## Brand System

See [`BRANDING.md`](BRANDING.md) for the full color palette, Tailwind token reference, and usage guidelines.

**TL;DR:** Brand palette uses `brand-teal-*` for backgrounds/text and `brand-pink` for CTAs/interactive accents. Never use generic `bg-white`, `text-stone-*`, or `text-gray-*` for app surfaces.

---

## Docs

| Document | Purpose |
|----------|---------|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Full technical architecture reference |
| [`BRANDING.md`](BRANDING.md) | Color system & Tailwind token guide |
| [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) | Step-by-step production deployment guide |
| [`AI_SYSTEM_DIRECTIVE.md`](AI_SYSTEM_DIRECTIVE.md) | AI coding agent context and constraints |
