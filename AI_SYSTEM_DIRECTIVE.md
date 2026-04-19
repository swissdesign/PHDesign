<system_directive>
ROLE: Senior_Software_Engineer & Autonomous_Coding_Agent
OBJECTIVE: Maintain and extend the PHDesign production site.
MODE: Careful/Incremental. Read ARCHITECTURE.md before any edit. Prefer contained, reviewable changes.
</system_directive>

<context_architecture>
STACK: Astro v5 (Hybrid/SSR), React 18 (islands), TailwindCSS (brand token system), Vercel Serverless (Node).
ROUTING: Astro pages in `src/pages/`. API endpoints in `src/pages/api/`. React SPA in `src/components/react/App.tsx`.
LOGIC_SEPARATION: API routes call `src/server/modules/` which use `src/server/adapters/`.
CMS: Google Sheets via `googleapis` (`src/server/adapters/googleSheets.ts`). Data normalised in `src/server/modules/cms.ts`.
LANGUAGE: German-first (de). Inline ternary translations — NO external i18n library. All components accept `lang?: Lang`.
BRANDING: Teal & Pink system — see BRANDING.md. Never use generic colors.
SECURITY: `_honey` traps active in contact/booking forms. `OPS_ADMIN_SECRET` protects `/api/ops/run`.
</context_architecture>

<env_state>
REQUIRED: GOOGLE_CMS_SHEET_ID, GOOGLE_LEADS_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, PAYREXX_INSTANCE, PAYREXX_API_KEY, PAYREXX_WEBHOOK_SECRET, OPS_ADMIN_SECRET.
TEMPLATE: See `.env.example` at repo root.
</env_state>

<completed_phases>
Phase 1 — Data & Routing Integrity (done):
- Viewport zoom lock removed
- CMS image normalisation (image || image_id)
- URL/view sync (updateViewRoute, syncStateFromUrl, popstate)
- lang param passed to getAll() in work/[slug].astro
- Dead title_de/title_en refs removed from PortfolioSurface

Phase 2 — Funnel & Trust Hardening (done):
- QuoteForm: trustworthy booking fallback (ok-but-no-url shows confirmation)
- ContactModal: real API error handling, error state with fallback email
- MenuModal: real legal URLs (no more href="#"), language switcher navigates real URLs
- ProjectDetail: hardcoded German filler paragraph removed
- Legal pages created: /[lang]/impressum, /[lang]/datenschutz, /[lang]/agb

Phase 3 — Mobile Showcase Polish (done):
- PortfolioGridMobile: hybrid layout (3 featured full-width + 2-col grid)
- ServicesTiles: prettifyLabel() (brand-systems → Brand Systems)
- All modal close buttons: 40px → 44px (Apple HIG minimum)
- Desktop hover: more pink (service cards, portfolio canvas, nav brand name)
- Hero CTA fix: Portfolio/Services buttons now flex-row, less vertical space

Phase 4 — Language Coherence (done):
- ServiceDetail: 7 strings now German-first (Leistung, Investition, Übersicht, Anfragen, Leistungsumfang, Details folgen, Projekt starten)
- ProjectDetail: 3 strings (Scrollen/Wischen, Live-Website besuchen, Leistungen)
- HeroExperimentsReact: 4 strings (Scrolle wenn du wagst, Nachweis, Die Beweise, Bereit zum Erkunden)

Phase 5 — Maintainability (done):
- README replaced (real project docs)
- ARCHITECTURE.md created (definitive technical reference)
- .env.example created
- Deprecated @astrojs/vercel/serverless import fixed
- AI_SYSTEM_DIRECTIVE updated to reflect completed state
</completed_phases>

<pending_tasks>
[T1] IMAGE_OPT: Apply `astro:assets` `<Image />` optimisation to portfolio and service images. Eliminates mobile scroll lag. Priority: high before heavy traffic.
[T2] DB_INIT: Verify column headers in PHD_LEADS_DB match what contact.ts and booking.ts write. Run smoke test via `/api/ops/run` with `smoke.cms` action.
[T3] PAYREXX_LIVE: Add real Payrexx credentials to Vercel env vars. Booking flow will then redirect to payment instead of showing confirmation screen.
[T4] EMAIL_AUTO: Implement email dispatch in contact.ts and booking.ts. Send localized auto-reply to client + internal admin alert. Use a transactional email provider (e.g. Resend, Postmark).
[T5] FR_IT_TRANSLATIONS: French and Italian routes exist but content is German/English only. Full translation pass required when targeting these markets.
</pending_tasks>

<operating_principles>
- Do not redesign for the sake of redesign.
- Do not introduce large speculative systems.
- Prefer contained, reviewable changes.
- Read ARCHITECTURE.md before editing routing, CMS, or API logic.
- Verify: does the site build? Check TypeScript. Push only passing commits.
- German-first: every user-visible string needs a `lang === 'de'` German version.
- Pink accent: every new interactive element should have a pink hover state.
</operating_principles>
