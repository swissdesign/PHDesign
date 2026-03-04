# Doc 6 — Practical Implementation Roadmap (Build Sequence for V1)

This document translates all previous blueprints into a **clear, sequential execution plan**.
The goal is simple:

**Ship a working V1 backend engine + your personal site using it.**

No theoretical wandering.
No unnecessary complexity.

This is the **exact order of building**.

If you follow this sequence, you will reach a working system **quickly and cleanly**.

---

# 0. Ground Rule for This Build

During V1 development you follow one rule:

**Always ship something working before adding the next layer.**

The build order must always be:

```
data → api → frontend → payments → ai layer
```

Never start with AI or dashboards first.

---

# Phase 1 — Repository Setup

Goal: Create a stable project structure.

### 1.1 Create project repo

```
pascalheiniger-site/
```

Inside it:

```
api/
src/
contracts/
docs/
```

---

### 1.2 Create backend structure

```
api/
_meta/
_ops/
payments/
cms.ts
contact.ts
booking.ts
```

```
src/server/
modules/
adapters/
lib/
```

```
contracts/v1/
```

---

### 1.3 Add basic utilities

Create:

```
src/server/lib/env.ts
src/server/lib/log.ts
src/server/lib/validate.ts
src/server/lib/id.ts
src/server/lib/mail.ts
src/server/lib/i18n.ts
```

These small utilities prevent messy code later.

---

# Phase 2 — Google Sheets Setup

Goal: Create your first data source.

Create two sheets.

---

## Sheet 1 — PHD_CMS_DB

Tabs:

```
Services
Config
```

### Services columns

```
id
active
sort
price_chf
deposit_pct
duration_label_de
duration_label_en
title_de
title_en
description_de
description_en
cta_de
cta_en
tags
```

Add 3–4 services for testing.

---

### Config tab

```
key | value
site_default_lang | de
currency | CHF
feature_booking_enabled | true
feature_contact_enabled | true
```

---

## Sheet 2 — PHD_LEADS_DB

Tabs:

```
Contacts
Bookings
PaymentEvents
```

Columns defined in Doc4.

---

# Phase 3 — Google Sheets Adapter

Goal: Abstract Google Sheets access.

Create:

```
src/server/adapters/googleSheets.ts
```

Functions:

```
readSheet(tab)
appendRow(tab,row)
updateRow(tab,id,row)
```

Use Google service account.

Environment variable:

```
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
```

This adapter becomes the **data layer**.

---

# Phase 4 — CMS Module

Goal: Serve services to frontend.

Create:

```
src/server/modules/cms.ts
```

Functions:

```
getServices(lang)
```

Logic:

1. read Services sheet
2. filter active
3. map language fields
4. sort

---

Create endpoint:

```
api/cms.ts
```

Returns:

```
GET /api/cms?lang=de
```

Test with browser.

Example response:

```
/api/cms?lang=de
```

Returns services JSON.

---

# Phase 5 — Contact Module

Goal: Accept contact requests.

Create:

```
src/server/modules/contact.ts
```

Steps:

1 validate input
2 append to Contacts sheet
3 send internal email
4 send auto reply

---

Endpoint:

```
POST /api/contact
```

Payload example:

```
{
name
email
phone
topic
service_id
message
lang
}
```

Test using Postman or frontend form.

---

# Phase 6 — Booking Module

Goal: Create booking record.

Create:

```
src/server/modules/booking.ts
```

Logic:

1 read service from CMS
2 calculate deposit
3 generate booking_id
4 write booking row
5 call payments module

---

Endpoint:

```
POST /api/booking
```

Returns:

```
booking_id
payment_url
deposit_amount
```

---

# Phase 7 — Payrexx Integration

Goal: Allow deposit payments.

Create:

```
api/payments/create.ts
api/payments/webhook.ts
```

---

## Payment creation

Endpoint:

```
POST /api/payments/create
```

Uses Payrexx API.

Input:

```
amount
title
email
booking_id
```

Return:

```
payment_url
reference
```

---

## Webhook endpoint

```
POST /api/payments/webhook
```

Logic:

1 verify Payrexx signature
2 read transaction
3 store event in PaymentEvents
4 update booking status
5 send email notification

---

Test flow:

1 create booking
2 pay deposit
3 webhook updates booking

---

# Phase 8 — Frontend Integration

Goal: Connect UI to backend.

Pages needed:

```
/
portfolio
services
service-detail
contact
booking-success
```

---

## Services page

Fetch:

```
GET /api/cms
```

Render cards.

Each card has:

```
Book service
```

---

## Booking modal

Fields:

```
name
email
phone
message
```

Submit:

```
POST /api/booking
```

Redirect to payment URL.

---

## After payment

Payrexx returns to:

```
/booking-success?booking_id=...
```

Show confirmation.

---

# Phase 9 — AI Machine Layer (Minimal)

Goal: Make backend readable by AI tools.

Create endpoints.

---

## Modules metadata

```
GET /api/_meta/modules
```

Returns modules and feature flags.

---

## Contracts endpoint

```
GET /api/_meta/contracts
```

Returns schemas from contracts folder.

---

## AI UI endpoint

```
GET /api/_meta/ai-ui
```

Returns panel definitions:

health
features
operations

---

## Ops runner

```
POST /api/_ops/run
```

Actions:

```
smoke_test
test_email
test_payrexx
booking_dry_run
```

Protected with:

```
OPS_ADMIN_SECRET
```

---

# Phase 10 — Logging + Observability

Add logging helper.

```
log.info
log.warn
log.error
```

Log events:

contact received
booking created
payment success
webhook failure

Logs stored in Vercel.

---

# Phase 11 — Security Hardening

Add:

### Honeypot fields

Bots get blocked.

---

### Rate limiting

Protect:

```
/api/contact
/api/booking
```

Simple IP limiter.

---

### Webhook signature verification

Reject invalid Payrexx events.

---

# Phase 12 — Feature Flags

Create:

```
src/server/_ops/feature.ts
```

Flags example:

```
booking_enabled
contact_enabled
payments_enabled
ai_draft_enabled
```

Endpoints check flags.

---

# Phase 13 — First Production Deployment

Deploy to Vercel.

Set environment variables.

Test:

1 contact form
2 booking flow
3 Payrexx payment
4 webhook updates
5 booking confirmation email

---

# Phase 14 — Stability Testing

Simulate real usage.

Test:

* incomplete bookings
* double webhooks
* payment failures
* invalid inputs
* missing services

Fix issues.

---

# Phase 15 — Documentation

Create docs folder.

Explain:

```
env variables
module system
contracts
AI layer
deployment
```

Future you will thank you.

---

# Phase 16 — V1 Complete

At this stage you have:

Working service booking
Deposit payments
Structured leads
AI readable backend
Reusable engine architecture

You can now:

Finish your website
Reuse engine for next project
Start refining modules

---

# Final Advice

During V1 you will constantly be tempted to add features.

Resist that.

Finish:

CMS
Contact
Booking
Payments
AI machine layer

Once those are stable, the rest becomes much easier.

---

If you want, the **next useful step** would be:

**Doc 7 — A very clear architecture diagram + mental model of the entire system (how all parts connect).**

That helps keep everything understandable as the system grows.
