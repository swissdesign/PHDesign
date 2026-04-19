# Architecture Reference — P. Heiniger Design Studio

> **Last updated:** April 2026 (post Phase 1–5 launch hardening)  
> **Purpose:** Definitive technical reference for developers and AI coding agents. Read this before editing any routing, CMS, or component logic.

---

## 1. High-Level Architecture

This is an **Astro v5 hybrid application** deployed on Vercel Serverless. It has two distinct rendering zones:

```
┌─────────────────────────────────────┐
│         Vercel Serverless           │
│                                     │
│  ┌────────────┐  ┌───────────────┐  │
│  │  Astro     │  │  API Routes   │  │
│  │  Pages     │  │  /api/*       │  │
│  │  (SSR)     │  │  (serverless  │  │
│  └─────┬──────┘  │   functions)  │  │
│        │         └───────┬───────┘  │
│        │                 │          │
│  ┌─────▼──────────┐      │          │
│  │  React SPA     │      │          │
│  │  (hydrated     │      │          │
│  │   island)      │      │          │
│  └────────────────┘      │          │
└──────────────────────────┼──────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
   ┌─────▼──────┐  ┌───────▼───┐  ┌──────────▼──┐
   │  Google    │  │  Payrexx  │  │  Google      │
   │  Sheets    │  │  (Swiss   │  │  Sheets      │
   │  (CMS)     │  │  payment) │  │  (Leads DB)  │
   └────────────┘  └───────────┘  └─────────────┘
```

**Rule:** Astro pages fetch CMS data server-side at request time and pass it to the hydrated React island as props. The React island **never** fetches CMS data itself — it only consumes what Astro passes. The API endpoints are the only place server-side logic runs for mutations (leads, bookings).

---

## 2. Routing

### URL Structure
```
/                           → redirect to /de/
/de/                        → Main app page (work view default)
/de/work                    → Main app page (work view active)
/de/services                → Main app page (services view active)
/de/work/[slug]             → SEO-optimised static project detail page
/de/impressum               → Static legal page
/de/datenschutz             → Static legal page
/de/agb                     → Static legal page
/[lang]/...                 → Same for en, fr, it
```

Supported languages are defined in `src/lib/i18n.ts`:
```ts
export const LANGS = ['de', 'en', 'fr', 'it'] as const;
export type Lang = typeof LANGS[number];
```

### View Switching (SPA)

The main app is a single Astro page (`/de/index.astro`) that renders a React island (`App.tsx`). Inside the React app, view switching between "work" and "services" is:
- **Client-side** — no full page reload
- **URL-synchronised** — `updateViewRoute()` in `App.tsx` updates the URL pathname to `/de/work` or `/de/services`
- **History-aware** — `popstate` events restore the correct view on browser back/forward

```
User clicks "Services" in menu
         → handleViewChange('services') in App.tsx
         → setCurrentView('services') [state]
         → updateViewRoute('services') [URL: /de/services]
         
User presses browser Back
         → popstate event fires
         → syncStateFromUrl() reads pathname
         → setCurrentView('work') [state restored]
```

**Critical:** The Hero experiment section (`HeroExperimentsReact.tsx`) is rendered **outside** the React island by Astro. Its CTAs dispatch a `ph-view-change` custom event that `App.tsx` catches to switch views on desktop. On mobile, they use standard `href` navigation.

---

## 3. CMS Data Flow

```
Google Sheets  →  googleSheets.ts  →  cms.ts  →  Astro Page  →  React Props
(raw rows)        (adapter)          (normaliser)  (SSR)          (typed)
```

### Sheet Structure (`cms.ts`)

The CMS normaliser (`src/server/modules/cms.ts`) maps raw sheet rows to typed objects. Key normalisation rules:

- **Project image**: Accepts both `image` and `image_id` column names (fallback for variant sheet structures)
- **Project title**: Resolved to a single `title` field (no `title_de`/`title_en` split)
- **Service categoryLabel**: Raw CMS value — may be a slug. The UI layer (`ServicesTiles.tsx`) applies `prettifyLabel()` before display

### Adding a new CMS field

1. Add the column to both Google Sheets
2. Add the field to the `ProjectRow` or `ServiceRow` interface in `cms.ts`
3. Map it in the `getProjects()` or `getServices()` normaliser function
4. Add it to the `Project` or `Service` type in `src/components/react/types.ts`

---

## 4. API Endpoints

All API routes are in `src/pages/api/`:

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/contact` | POST | Save contact lead to Sheets | None (honeypot) |
| `/api/booking` | POST | Create Payrexx payment link + save lead | None (honeypot) |
| `/api/payments/webhook` | POST | Handle Payrexx payment confirmation | HMAC signature |
| `/api/cms` | GET | Proxy CMS data | None |
| `/api/ops/run` | POST | Admin health/smoke tests | Bearer OPS_ADMIN_SECRET |
| `/api/meta-contracts` | GET | Machine-readable API shape | None |
| `/api/meta-modules` | GET | Module map for AI agents | None |

### Contact Flow
```
ContactModal.tsx  →  POST /api/contact
                      → validates payload
                      → checks _honey (spam trap)
                      → appendRow to LEADS sheet
                      → returns { ok: true }
```

### Booking Flow
```
QuoteForm.tsx  →  POST /api/booking
                    → validates payload
                    → creates Payrexx gateway
                    → appendRow to LEADS sheet
                    → returns { ok: true, payment: { url } }
                    
If payment.url present: redirect to Payrexx
If ok but no url: show confirmation (Payrexx not yet live)
If error: show error state with fallback email
```

---

## 5. Language System

**German-first.** `lang = 'de'` is the default everywhere.

### How it works

- Every page is generated for all 4 `LANGS` via `getStaticPaths()`
- The `lang` param flows through: Astro page → React `App` → all child components
- Every component that renders user-visible text accepts `lang?: Lang`
- Translations are **inline ternaries** — no external i18n library

```tsx
// Pattern used throughout
{lang === 'de' ? 'Leistungsumfang' : "What's included"}

// Some Hero components use isEn for brevity
const isEn = lang === 'en';
{isEn ? 'The Evidence.' : 'Die Beweise.'}
```

### Language switcher

The `MenuModal.tsx` language switcher navigates to the real URL with the lang segment replaced:
```ts
const pathParts = window.location.pathname.split('/').filter(Boolean);
pathParts[0] = targetLang; // replace "de" → "en"
const targetPath = '/' + pathParts.join('/');
```

### FR/IT

French and Italian routes exist but the content is in German only. The lang switcher navigates correctly but there are no translated strings for FR/IT yet — they fall through to English fallback.

---

## 6. Component Map

### React SPA Components (`src/components/react/components/`)

| Component | Role | Mobile | Desktop |
|-----------|------|--------|---------|
| `Navigation.tsx` | Fixed top nav + menu trigger | ✅ | ✅ |
| `MenuModal.tsx` | Full-screen menu overlay | ✅ | ✅ |
| `PortfolioSurface.tsx` | Desktop infinite scroll canvas | ❌ | ✅ |
| `PortfolioGridMobile.tsx` | Mobile portfolio grid (hybrid: 3 featured + 2-col) | ✅ | ❌ |
| `ProjectDetail.tsx` | Project detail modal (image gallery + info panel) | ✅ | ✅ |
| `ServicesTiles.tsx` | Services grid + service detail trigger | ✅ | ✅ |
| `ServiceDetail.tsx` | Service detail modal (info + booking tabs) | ✅ | ✅ |
| `QuoteForm.tsx` | 4-step booking form → Payrexx | ✅ | ✅ |
| `ContactModal.tsx` | Contact inquiry form → /api/contact | ✅ | ✅ |
| `ThemeToggle.tsx` | Light/dark theme toggle | ✅ | ✅ |
| `CookieConsent.tsx` | Cookie consent overlay | ✅ | ✅ |

### Non-React Components

| Component | Location | Role |
|-----------|----------|------|
| `HeroExperimentsReact.tsx` | `src/components/react/` | Scroll-driven narrative hero (Astro island) |
| `BaseLayout.astro` | `src/layouts/` | HTML shell, meta tags, Google Fonts |

### App.tsx Responsibilities

`App.tsx` is the root of the React SPA. It owns:
- `currentView` state (`'work' | 'services'`)
- `selectedProject` state (currently open project modal)
- `isContactOpen` state (contact modal open/closed)
- URL synchronisation (`updateViewRoute`, `syncStateFromUrl`, `popstate` listener)
- `ph-view-change` custom event listener (Hero CTA integration)
- All modal open/close transitions

---

## 7. Theme System

The site has light and dark modes. Theme state is owned by `App.tsx` and passed as a `theme: 'light' | 'dark'` prop to all child components.

- **Light mode**: Teal-light backgrounds, pink CTAs
- **Dark mode**: Deep teal/abyss backgrounds, lighter pink CTAs

Components should **never** use `document.body.classList` or CSS variables for theming — always use the `theme` prop and inline conditional classes.

---

## 8. Mobile vs Desktop Rendering

The app uses a combination of:
- **CSS breakpoints** (`md:`, `lg:`) for layout differences
- **`isMobile` state** in some modals (window width < 768) for full-screen vs centered modal
- **`isCoarsePointer`** media query for touch device detection (hides nav during modals)
- **Different components**: `PortfolioSurface` (desktop canvas) vs `PortfolioGridMobile` (mobile grid) are conditionally rendered in `App.tsx`

---

## 9. Known Limitations & Future Work

| Item | Detail |
|------|--------|
| **Payrexx live keys** | Booking flow shows confirmation screen if no payment URL returned. Activate by adding real `PAYREXX_*` keys to Vercel env vars. |
| **FR/IT translations** | Routes exist, content falls back to German/English. Full translations not yet done. |
| **Email notifications** | `/api/contact` and `/api/booking` save to Sheets but do not send emails. Auto-email is listed in `AI_SYSTEM_DIRECTIVE.md` task [T4]. |
| **Image optimisation** | CMS images are served from Google Drive. `astro:assets` `<Image />` optimisation is not yet applied. Task [T1] in directive. |
| **Hero on mobile** | The 1000vh scroll narrative is skipped on mobile (direct link navigation). This is intentional — the experience is not designed for mobile scroll. |

---

## 10. Environment Variables

```env
# Google Sheets CMS
GOOGLE_CMS_SHEET_ID=              # Sheet ID for CMS content
GOOGLE_LEADS_SHEET_ID=            # Sheet ID for leads/bookings
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64= # base64-encoded service account JSON

# Payrexx (Swiss payment gateway)
PAYREXX_INSTANCE=                 # Payrexx subdomain (e.g. "meinshop")
PAYREXX_API_KEY=                  # Payrexx API secret
PAYREXX_WEBHOOK_SECRET=           # Payrexx webhook HMAC secret

# Internal
OPS_ADMIN_SECRET=                 # Bearer token for /api/ops/run
```

See [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) for how to generate each value.
