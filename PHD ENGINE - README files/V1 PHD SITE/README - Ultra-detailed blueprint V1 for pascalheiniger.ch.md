## Doc 4 — Ultra-detailed blueprint V1 for **pascalheiniger.ch**

**Goal:** Ship a premium-looking frontend + a reusable backend engine (serverless on Vercel) with **Payrexx payments**, **service booking**, **contact**, **multi-language (DE/EN)**, and the **AI Machine Layer** (contracts + AI UI spec + ops runner).
This is written so you can build it once, then reuse across projects and future clients.

---

# 0) What you’re building (V1 definition)

### The site (frontend)

* Pages/sections:

  * **Portfolio** (read-only, optional CMS later)
  * **Services** (from source-of-truth)
  * **Service detail** (optional modal or page)
  * **Booking flow** (deposit payment + confirmation)
  * **Contact** (context-aware: service preselected if user came from services)
* Languages:

  * **DE** and **EN** only in V1
  * Automatic fallback: EN fallback if DE missing
* “Premium” constraint:

  * The frontend is showy/modern (your strength) but the backend stays **boringly reliable**.

### The engine (backend)

V1 modules (feature-flagged):

1. `cms` (source-of-truth for services + optional portfolio metadata)
2. `contact` (writes to leads store + email notifications)
3. `booking` (service booking: creates booking record + triggers payment)
4. `payments` (Payrexx: create payment link + webhook verification)
5. `ai` (AI Machine Layer: contracts + UI spec + ops)
6. optional stubs:

   * newsletter (disabled)
   * blog (disabled)
   * calendar sync (disabled)

### Deposit rule (your plan)

* **50% deposit required** to confirm booking request
* Remaining 50% is handled manually (V1) or later via invoice flow (V2)

---

# 1) Tech stack choices (V1)

You want fast shipping + copy-paste reuse:

### Hosting/runtime

* **Vercel** (serverless functions)
* **Astro or Vite/React** frontend (you already have patterns)
* Keep runtime Node 20+ (Vercel default)

### Data source-of-truth (V1)

* **Google Sheets** first (fastest; client-friendly)
* You already have a working pattern from Pinte; reuse the shape but simplify.

### When to move to Supabase (later)

* Not in this doc yet; this is V1 with a clean migration seam.

---

# 2) Repo layout (template-friendly)

You want a backend engine you can drop into any repo. Use a standard structure:

```
/api
  /_meta
    modules.ts
    contracts.ts
    ai-ui.ts
  /_ops
    run.ts
    config.ts
    feature.ts
    logs.ts
  cms.ts
  contact.ts
  booking.ts
  payments
    create.ts
    webhook.ts
/src
  /server
    /adapters
      googleSheets.ts
      supabase.ts (stub)
    /modules
      cms.ts
      contact.ts
      booking.ts
      payments.ts
    /lib
      env.ts
      validate.ts
      log.ts
      mail.ts
      i18n.ts
      id.ts
/contracts
  v1/
    cms.schema.json
    contact.schema.json
    booking.schema.json
    payments.schema.json
    errors.schema.json
    meta.schema.json
```

**Rule:** `/api/*` should be thin routers; real logic sits in `/src/server/*`.
That keeps modules portable.

---

# 3) Data model (V1) — Google Sheets as DB

You need a sheet structure that is:

* consistent
* easy for client editing
* AI-readable
* migration-friendly to Supabase later

## 3.1 Google Sheet IDs

You will have two sheets (recommended):

1. `PHD_CMS_DB` (services + optional portfolio data)
2. `PHD_LEADS_DB` (contact + bookings)

You *can* keep them in one sheet, but splitting reduces risk.

---

## 3.2 Tabs in `PHD_CMS_DB`

### `Services`

Columns (explicit, stable):

* `id` (string, unique, stable slug like `brand-system-starter`)
* `active` (TRUE/FALSE)
* `sort` (number)
* `price_chf` (number)
* `deposit_pct` (number, default 50)
* `duration_label_de`, `duration_label_en` (e.g., “2 Wochen”, “2 weeks”)
* `title_de`, `title_en`
* `subtitle_de`, `subtitle_en` (optional)
* `description_de`, `description_en` (long)
* `deliverables_de`, `deliverables_en` (pipe separated or JSON string)
* `cta_de`, `cta_en` (button label)
* `stripe_like_sku` (optional future)
* `tags` (comma separated)

**Why this shape:**

* It’s human-editable
* It’s machine-mappable
* It’s easy to migrate to SQL later (each column becomes a field)

### `Config`

* `key`, `value`
  Keys:
* `site_default_lang` = `de`
* `currency` = `CHF`
* `payrexx_instance` (optional if you want)
* `payrexx_webhook_secret` (not recommended in sheet; keep in env)
* `feature_booking_enabled` = `true`
* etc.

---

## 3.3 Tabs in `PHD_LEADS_DB`

### `Contacts`

Columns:

* `created_at` (timestamp)
* `name`
* `email`
* `phone` (optional)
* `lang` (DE/EN)
* `topic` (GENERAL / SERVICE_INQUIRY)
* `service_id` (optional)
* `message`
* `status` (NEW / READ / DONE)
* `internal_notes` (optional)

### `Bookings`

Columns:

* `created_at`
* `booking_id` (uuid-like)
* `service_id`
* `service_title_snapshot`
* `lang`
* `name`
* `email`
* `phone`
* `preferred_start_date` (optional)
* `notes`
* `price_chf_snapshot`
* `deposit_pct_snapshot`
* `deposit_amount_chf_snapshot`
* `payment_provider` (PAYREXX)
* `payment_status` (CREATED / PAID / FAILED / REFUNDED)
* `payrexx_reference` (transaction reference)
* `status` (NEW / CONFIRMED / IN_PROGRESS / DONE / CANCELED)

### `PaymentEvents`

Columns:

* `created_at`
* `booking_id`
* `provider`
* `event_type`
* `raw_payload` (stringified JSON)
* `signature_valid` (TRUE/FALSE)
* `processed` (TRUE/FALSE)

**Why store PaymentEvents:**
If Payrexx webhook fails once, you can replay safely and audit.

---

# 4) Backend modules (V1)

Each module has:

* contract schema
* router endpoint
* internal module logic
* feature flag

## 4.1 CMS module

### Endpoint

* `GET /api/cms?lang=de`

### Behavior

* Reads `Services` tab
* Filters `active == TRUE`
* Sorts by `sort`
* Localizes fields based on `lang`
* Returns JSON with stable keys

### Contract output (example)

```json
{
  "ok": true,
  "services": [
    {
      "id": "brand-system-starter",
      "title": "Brand System Starter",
      "duration_label": "2 Wochen",
      "price_chf": 2400,
      "deposit_pct": 50,
      "description": "...",
      "deliverables": ["...", "..."],
      "tags": ["branding", "system"]
    }
  ]
}
```

**Critical:** frontends should rely on this stable structure only.

---

## 4.2 Contact module

### Endpoint

* `POST /api/contact`

### Input

* name/email/message required
* `topic` + optional `service_id`
* language

### Actions

1. Validate input
2. Append to `Contacts` sheet
3. Send internal email to `design@pascalheiniger.ch` (or alias routing)
4. Send auto-reply (DE/EN)
5. Optional AI draft later (feature-flag)

### Output

```json
{ "ok": true, "saved": true, "internal_sent": true, "autoreply_sent": true }
```

---

## 4.3 Booking module

This is the core of V1.

### Endpoint

* `POST /api/booking`

### Input

* `service_id`
* contact details
* optional preferred dates
* notes

### Actions

1. Validate + load service from CMS
2. Create booking_id
3. Calculate deposit amount:

   * `deposit_amount = round(price_chf * deposit_pct / 100)`
4. Write booking record to `Bookings` sheet with snapshot values
5. Create Payrexx payment link:

   * calls `payments/create` internally
6. Return payment URL to frontend

### Output

```json
{
  "ok": true,
  "booking_id": "bk_...",
  "payment": {
    "provider": "payrexx",
    "amount_chf": 1200,
    "url": "https://payrexx.com/..."
  }
}
```

---

## 4.4 Payments module (Payrexx)

You will have two endpoints:

### A) Create payment

* `POST /api/payments/create`
* Called by booking module only (or also by admin ops)

Inputs:

* booking_id
* amount
* title
* email

Returns:

* payment_url
* payrexx reference id

### B) Webhook

* `POST /api/payments/webhook`
* Called by Payrexx

Responsibilities:

1. Verify webhook signature (critical)
2. Parse event → determine payment status
3. Write to `PaymentEvents`
4. Update `Bookings.payment_status` to `PAID` when confirmed
5. Send internal email notification “Deposit paid”
6. Optionally send client confirmation email

**V1 simplification:**
You only need “PAID vs not paid” and store raw payload.

---

# 5) Frontend booking UX (V1)

You want minimal friction, premium feel.

## 5.1 Suggested flow

1. User clicks “Book service”
2. Modal or page shows:

   * service overview (title + price + duration)
   * deposit note (50% deposit required)
   * short form: name, email, phone, message
3. Submit → backend returns Payrexx payment link
4. Redirect user to Payrexx
5. After payment:

   * Payrexx returns to `/booking/success?booking_id=...`
   * Frontend shows “Thanks—deposit received” (or “We’ll confirm soon”)
6. Internal email to you triggers personal touch follow-up

## 5.2 Handling “half now half later”

V1:

* deposit paid triggers:

  * booking status = CONFIRMED
  * you manually invoice the remainder later
    V2:
* automatic invoice + second payment link later

---

# 6) AI Machine Layer (C) applied to your personal site

This is the “bridge” you care about.

## 6.1 V1 AI layer endpoints (build these first)

### `GET /api/_meta/modules`

Returns:

* which modules exist
* enabled flags
* required config keys
* version hashes

### `GET /api/_meta/contracts?v=1`

Returns:

* list of JSON schemas
* links / embedded minimal schema objects
* examples

### `GET /api/_meta/ai-ui?v=1`

Returns:

* AI UI representation:

  * toggles
  * config field states (redacted)
  * actions (smoke tests, sync)
  * “health” view

### `POST /api/_ops/run`

Runs allowlisted actions like:

* smoke tests
* “send test email”
* “rebuild CMS cache”
* “verify Payrexx config”
* “simulate booking dry-run”

---

## 6.2 What makes it AI-friendly (practical rules)

### Rule 1: Small stable vocabulary

* `features.*`
* `config.*`
* `actions.*`
* `contracts.*`
* `health.*`

### Rule 2: Every endpoint returns normalized errors

Even if internal errors differ:

```json
{
  "ok": false,
  "error": { "code": "PAYREXX_SIGNATURE_INVALID", "message": "...", "details": {} }
}
```

### Rule 3: “valueState” for secrets

The AI UI should never leak secrets; it should show:

* `set` vs `missing`

---

## 6.3 Minimal AI UI spec for V1 (example blocks)

Panel: Health

* CMS reachable?
* Sheets auth ok?
* Payrexx configured?
* Email sending ok?

Panel: Features

* booking enabled
* contact enabled
* ai_draft enabled (off)

Panel: Operations

* run smoke tests
* run “test Payrexx create link”
* run “test email send”
* run “booking dry-run” (no write)

Panel: Contracts

* list versions and schema refs

---

# 7) Environment variables (V1)

This is where you prevent 80% of deployment pain.

## 7.1 Required env vars

### Google Sheets

* `GOOGLE_CMS_SHEET_ID`
* `GOOGLE_LEADS_SHEET_ID`
* `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` (recommended single var)
* optional: `GOOGLE_IMPERSONATE_EMAIL` (if using domain delegation)

### Email

Depending on your sending method:

* If using Gmail API via service account: needs delegation + scopes
* If using SMTP (not recommended if you want reuse)
* If using Resend/Postmark (best later for productizing)

For V1 you can:

* send internal email to `design@...`
* send autoreply from same sender (or from no-reply)

### Payrexx

* `PAYREXX_INSTANCE` (e.g., your subdomain)
* `PAYREXX_API_KEY`
* `PAYREXX_WEBHOOK_SECRET`
* `PAYREXX_RETURN_URL` (site success url)
* `PAYREXX_CANCEL_URL`

### AI layer

* `OPS_ADMIN_SECRET`
* `FEATURE_FLAGS_JSON` (optional convenience)

---

# 8) Security baseline (V1)

You’re handling payments → do not skip.

## 8.1 Webhook signature verification

Must be strict. If invalid:

* log event
* return 401
* do not update booking

## 8.2 Rate limiting

At least for:

* `/api/contact`
* `/api/booking`
* `/api/payments/webhook`

V1 cheap solution:

* simple IP-based limiter in memory (not perfect)
* or Vercel Edge Middleware later

## 8.3 Honeypot

Add hidden field on forms:

* if filled, silently drop

---

# 9) Migration seam: Sheets → Supabase (future-proofing V1)

Even in V1, implement adapters:

### Adapter interface (concept)

* `cms.getServices(lang)`
* `leads.saveContact(payload)`
* `leads.createBooking(payload)`
* `leads.updateBookingPayment(booking_id, status, ref)`
* `leads.savePaymentEvent(payload)`

V1 implementation: Google Sheets
Later: Supabase

This means the frontend and modules don’t care where data lives.

---

# 10) Practical execution order (what you actually do next)

This is the “do not lose sight” plan.

## Phase A — Ship the site skeleton (frontend)

1. Build portfolio + services UI
2. Integrate language switch (DE/EN)
3. Services pull from `/api/cms`
4. Add booking CTA on each service

**Deliverable:** site looks done, but booking doesn’t charge yet.

## Phase B — Wire booking + Payrexx deposit

1. Implement `/api/booking`
2. Implement `/api/payments/create`
3. Implement `/api/payments/webhook`
4. Add booking success page
5. Add internal email notifications

**Deliverable:** real deposit payment works end-to-end.

## Phase C — AI machine layer minimal

1. `_meta/modules`
2. `_meta/contracts`
3. `_meta/ai-ui`
4. `_ops/run` with:

   * smoke tests
   * payrexx test
   * email test
   * booking dry-run

**Deliverable:** backend is “AI legible.”

## Phase D — Harden + polish

* rate limits
* honeypots
* logging improvements
* better validation messages
* minimal docs + release checklist

---

# 11) What “done” means (V1 acceptance criteria)

You’re done when:

### Business outcomes

* You can sell services directly
* You can receive deposits reliably
* You get structured booking records
* Clients get a clean confirmation experience

### Engineering outcomes

* Every module is toggleable
* Contracts exist and are versioned
* AI UI spec exists and is accurate
* Ops runner can run smoke tests safely
* Swapping Sheets→Supabase later is not a rewrite

---

# 12) Immediate next step for you (today)

To proceed fastest, you should decide one key V1 detail:

### Payment UX choice

A) Redirect to Payrexx payment page (simplest, reliable)
B) Embedded checkout (more work, more risk)

For V1 I strongly recommend **A**.

---

If you say **“ok”**, I’ll send **Doc 5**: the long-term plan (future-proof engine product, modules, when to move to Supabase, when to move off serverless, and how to get to a sellable stage + clients).
