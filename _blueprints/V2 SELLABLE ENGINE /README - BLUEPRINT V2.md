0) What we are building (in one sentence)

A repeatable web product engine where any frontend (AI-generated or hand-built) can plug into a stable set of backend modules (contact, bookings, events, newsletter, payments, AI drafts, etc.) through a strict, AI-readable contract layer, so shipping new client projects becomes assembly, not reinvention.

1) Core principles (so you don’t drift)
1.1 “Backend is the product”

Frontends will get cheaper and faster (AI), so your defensibility is:

reliable integrations

data integrity

automation

ops + observability

compliance-ready handling

1.2 Serverless-first, vendor-agnostic design

Start with Vercel serverless because speed + shipping matters.

Keep an escape hatch: all modules should be portable (move from Google Sheets → Supabase/Postgres without rewriting the frontend).

1.3 One source of truth per project

Pick one:

early: Google Sheets (fastest for client editing)

later: Postgres (Supabase/Neon) for stronger consistency, constraints, reporting

But always hide this behind the same API contract so frontends don’t care.

1.4 “Kill switch” is a product feature

Every module is:

disabled by default

can be enabled per client

supports graceful fallback UI

has a billing hook (even if manual first)

1.5 Build the “boring” parts like a bank

Every endpoint should eventually have:

validation

rate limiting

logging

idempotency for writes

error normalization

safe client-facing messages

2) Market positioning and why this is future-proof
2.1 Why it will still matter when AI can build sites

AI will generate frontends easily, but businesses still need:

bookings that don’t break

emails that route correctly

calendars that sync correctly

payments that reconcile

GDPR/Swiss compliance

systems that survive staff turnover

That’s your moat.

2.2 Your target wedge (realistic)

Start with:

restaurants/bars

small hotels

guides/schools

local service businesses
Because they all share: contact, bookings, events, newsletters, payments, multi-language

Then expand:

boutique ecom (light)

memberships

ticketing-lite

3) System architecture (end-state view)

Think in three layers:

3.1 Presentation layer (any frontend)

Astro/Vite/React

Framer/WeWeb/Next

AI-generated static sites

Rule: frontends never talk directly to Google APIs, SMTP, etc.
They only call your stable endpoints.

3.2 Engine layer (modules)

Each module is a unit with:

endpoints

data schema

config keys

logs + monitoring

Example modules:

CMS read (menu/events/gallery)

Contact + routing

Reservation + calendar

Payments (Payrexx)

Newsletter (Mailchimp or native)

AI draft assistant

Admin dashboard / moderation

Media (Drive folder proxy / uploads)

Auth (optional)

3.3 AI machine layer (glue + contract)

This is the “AI-friendly backbone”:

strict JSON contracts

metadata for field meaning

consistent naming conventions

endpoint discoverability

feature flags surfaced as machine-readable config

It makes the system easy for:

your AI workflows

future “AI operator” agents

future client dashboards

future migration to Supabase

4) Roadmap to a sellable engine (phased, practical)
Phase A — Stabilize the Pinte pattern (now → next 1–2 weeks)

Objective: prove the engine approach on a real client with real usage.

Deliverables:

Contact + reservation endpoints stable

reliable routing

writes to the Leads DB

calendar sync where needed

Module configuration via env + config tab

sheet IDs

emails

feature flags

Error-proofing

no more module-not-found

TS builds clean

predictable behavior in Vercel

Exit criteria:

smoke tests always pass

Tom can use it without you babysitting it

Vercel deploy is boring

Phase B — Extract “Engine Template v1”

Objective: turn one-off code into a reusable skeleton.

Deliverables:

a repo template structure:

/api/modules/*

/api/_lib/*

/src/server/* (shared engine libs)

/contracts/* (schemas + examples)

/config/* (feature flags, module map)

documentation:

“How to launch a new client project in 60 minutes”

base modules enabled by default:

CMS read

Contact

basic booking

newsletter signup

optional modules behind flags:

calendar sync

AI draft

payments

gallery sync

Exit criteria:

you can spin up a second site in 1 day

same patterns, same endpoints, minimal custom code

Phase C — Add “Admin-lite” UI (client-friendly)

Objective: reduce client friction and reduce your maintenance.

Deliverables:

a minimal admin UI route (protected):

toggle modules on/off

view latest leads

quick edit “CMS” content (if still on Sheets, this can be shallow)

view last errors / logs summary

Important: you don’t need full CRUD to start.
Start with read + toggles.

Exit criteria:

clients can self-service simple edits

fewer support calls

Phase D — Monetize as a product (even if service-led)

Objective: turn this into packaging + pricing.

Start with:

“Base site” + “Modules”

monthly maintenance (hosting + monitoring + updates)

Module examples:

Booking + calendar sync

Newsletter automation

AI reply drafts

Payments integration

Event registration

Analytics dashboard

Multi-location support

Exit criteria:

first 3 paying “engine clients” on the same backend skeleton

5) When to move from Google Sheets → Supabase (decision framework)

Sheets is great for:

speed

client familiarity

tiny datasets

low compliance risk (basic leads)

Sheets becomes painful when:

you need relational integrity

many concurrent writes

advanced filtering/reporting

audit logs

permissions per staff role

large datasets

strict data governance

Migration trigger checklist (use this as your rule)

Move a client to Supabase when any 2 are true:

more than ~200 leads/month reliably

more than ~20 reservations/week through the site

needs role-based access (staff accounts)

needs reporting dashboards (monthly KPIs)

needs stronger compliance/audit logs

needs multi-location, multi-calendar, or complex constraints

Swiss data constraints (practical reality)

If client data must remain in Switzerland:

use a Swiss/European hosting provider for Postgres (options vary by time)

or keep Sheets (Google’s data regions can be tricky depending on workspace settings)

Your engine should support both, behind the same contract.

Key idea: frontends should not change when you migrate storage.
Only the engine module’s adapter changes.

6) When to move from serverless → dedicated server (also a decision framework)

Stay on Vercel serverless until:

you need long-running jobs (minutes)

you need websockets/realtime for staff operations

you want heavy background processing (image/video)

costs become inefficient at scale (very high invocations)

you need private network access / VPN / special compliance

you want a queue worker system (bullmq, etc.)

Practical stepping stones before “a server”

Instead of jumping to a monolithic server:

Keep Vercel for HTTP endpoints

Add a queue (Upstash Redis / Cloud Tasks)

Add scheduled jobs (Vercel cron)

Add a worker service only when needed

This keeps your operations simpler.

7) Payments (Payrexx) integration plan (engine-level)
Minimal Payrexx module (MVP)

Create payment link / checkout session for a service booking

Store:

booking intent

amount/currency

status

reference ID

Webhook endpoint:

verify Payrexx signature

update booking status

trigger email confirmation

optionally write to Sheets/Supabase

Why this is an engine module

It’s reusable for:

deposits (50/50)

event tickets (simple)

vouchers

down payments for services

Go-to-market packaging

“Payments Add-on”

“Deposits Add-on”

“Invoice automation Add-on” later

8) The “module store” concept (realistic version)

Your idea: modules exist, you enable them when client pays.

V1 realistic approach (avoid overbuilding)

Feature flags in config

Admin toggles in your private admin

Manual billing/invoice

Hard kill-switch: module returns 404/disabled response + frontend hides

V2 productized approach

license key per client

module entitlement stored in DB

billing integration

usage limits enforced (requests/day, leads/month)

Do not build V2 until you have 5+ engine clients.
Until then, manual toggles are perfect.

9) “AI Agent backdoor” (future, but plan now)

Your earlier “AI handles first emails and fills sheets” is a V2+ product.

The engine should be built so it can evolve into:

inbound email parser → structured lead

AI clarification loop

human approval checkpoints

But for now:

AI drafts (assist Tom) is good

Keep it optional and safe

10) Shipping strategy (how you get clients while building)
Step 1: Use your own site as the demo

your design site becomes the “engine showroom”

you dogfood:

multi-language

services booking

Payrexx

contact routing

AI draft assist

Step 2: Productize your offer (simple)

Example:

Setup fee (CHF)

monthly fee (hosting + updates + support)

add-ons priced clearly

Step 3: Build 2–3 vertical examples

bar/restaurant (Pinte)

service business (your site)

small hotel/guide network (later)

This makes selling easier: “Pick a base, add modules.”

11) Operational discipline (what keeps this scalable)

If you want 20–40 clients:

versioned modules

consistent contracts

reproducible deployments

monitoring

Minimum you should adopt early:

per-project env checklist

per-release smoke test list

error logging pipeline (even lightweight)

cron health checks

12) Concrete next steps (what you do after Pinte is stable)

Extract “Engine Template v1” repo structure

Implement Payrexx module on your own site (safe sandbox)

Create a minimal admin toggles page (protected)

Write 2 docs:

“launch a project”

“module catalog”

Sign 1–2 more clients using the same engine