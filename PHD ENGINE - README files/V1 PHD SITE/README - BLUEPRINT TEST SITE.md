Engine V1 Blueprint for the P. Heiniger Design Site

This blueprint outlines a lean but future‑proof modular backend for a personal site that showcases your design portfolio, offers service bookings, and processes payments. The primary goals are to:

Ship quickly with minimal features by leveraging Google Sheets and Payrexx for data and payments.

Stay modular and self‑describing so that AI‑generated front‑ends (and human developers) can plug in without ambiguity.

Provide a clear path for future enhancements—AI drafts, Supabase migration, events, newsletters, etc.—without breaking the core.

This plan deliberately leaves your existing Pinte implementation untouched. You can reuse the modules here for other clients once you see how it works on your own site.

1. Overview of the V1

Site sections:

Portfolio – static or CMS‑driven gallery of projects.

Services – list of service offerings with details, price and booking CTA.

Bookings – form to book a service; requires 50 % deposit via Payrexx.

Contact – simple contact form for general enquiries.

Payment success/failure pages – display after Payrexx checkout.

Core modules:

Module	Description	External dependencies
featureRegistry	Centralised feature flags per tenant; determines enabled modules.	None (JSON config in repo or Sheet)
capabilities	Endpoint returning enabled features + schema references.	None
schemas	Minimal JSON schemas for each module’s input structure.	None
services	Source of truth for services (id, name, price, description, price).	Google Sheets (or local JSON in V1)
bookings	Handles booking creation, stores booking rows, triggers payments.	Google Sheets, Payrexx API
payments	Creates checkout links and processes webhooks.	Payrexx API
contact	Handles generic contact forms; stores leads.	Google Sheets (optional email sender)

All modules must conform to a standard response contract ({ ok: true/false, data?, error? }) and expose their input schema for AI clients via /api/ai/schema/<module>.

2. Core architecture
2.1 Feature registry

Create a simple JSON configuration (e.g. /src/core/features.ts) that enumerates which features are active. For your personal site it could look like:

export const FEATURES = {
  services: true,
  bookings: true,
  payments: true,
  contact: true,
  events: false,
  newsletter: false,
  aiDraft: false,
} as const;

You can later turn modules on/off per tenant or environment. During requests, call requireFeature('bookings') and throw a FEATURE_DISABLED error if false.

2.2 Capability endpoint

Expose a GET endpoint at /api/capabilities that returns a machine‑readable snapshot of available features and their endpoints. Example response:

{
  "engine_version": "1.0.0",
  "base_url": "https://your‑site.com/api",
  "success_template": {"ok": true, "data": {}, "meta": {}},
  "error_template": {"ok": false, "error": {"code": "", "message": ""}},
  "features": {
    "services": {
      "enabled": true,
      "method": "GET",
      "endpoint": "/api/services",
      "schema_ref": "/api/ai/schema/services"
    },
    "bookings": {
      "enabled": true,
      "method": "POST",
      "endpoint": "/api/bookings",
      "schema_ref": "/api/ai/schema/bookings"
    },
    "contact": {
      "enabled": true,
      "method": "POST",
      "endpoint": "/api/contact",
      "schema_ref": "/api/ai/schema/contact"
    },
    "payments": {
      "enabled": true,
      "create": {
        "method": "POST",
        "endpoint": "/api/payments/create",
        "schema_ref": "/api/ai/schema/paymentCreate"
      },
      "webhook": {
        "method": "POST",
        "endpoint": "/api/payments/webhook"
      }
    }
  }
}

Front‑ends (whether hand‑coded or AI‑generated) can fetch this endpoint and know exactly what services the backend offers and where to get the schemas.

2.3 Schema endpoints

For each module there must be a corresponding schema describing required and optional fields in a minimal JSON format—avoid excessive Zod/OpenAPI verbosity. Example for bookings:

{
  "name": "bookings",
  "required": ["service_id", "customer_name", "customer_email"],
  "properties": {
    "service_id": "string",
    "customer_name": "string",
    "customer_email": "string(email)",
    "customer_phone": "string(optional)",
    "message": "string(optional)",
    "lang": "enum(de,en)",
    "options": "object(optional)"
  }
}

Provide these as static JSON files or assemble them programmatically from your Zod definitions. AI systems can use the schema to generate forms and validate input.

2.4 Provider abstraction layer

Keep external integrations behind a provider interface so the business logic remains decoupled:

dbProvider – current implementation uses Google Sheets. Define methods: createRow(tableName: string, record: object), getRows(tableName, filter?), etc.

emailProvider – optional; use Gmail or Resend if you need email notifications.

paymentProvider – wrapper around Payrexx for creating payment links and verifying signatures.

aiProvider – future module for generating AI replies. Keep stubbed for now.

Switch providers by configuration or environment variables. When migrating to Supabase, only replace dbProvider.ts—the rest of the code stays the same.

3. Services Module
3.1 Data source

Maintain a Services tab in Google Sheets with at least these columns:

| id (string) | title_de (string) | title_en (string) | price_chf (number) | duration (string) | description_de (string) | description_en (string) | active (TRUE/FALSE) |

You can add extra fields (e.g. image URL, category) if needed, but keep the structure consistent.

3.2 API endpoints

GET /api/services

Returns an array of service objects, filtering out rows where active is FALSE.

You should not return price in languages where you want to hide it—control this with frontend flags.

3.3 AI schema

Expose a schema:

{
  "name": "services",
  "properties": {
    "id": "string",
    "title": "string(multilingual)",
    "price_chf": "number",
    "duration": "string",
    "description": "string(multilingual)"
  }
}

Allow AI to render service cards automatically based on this structure.

4. Bookings Module

The booking module handles creation of bookings and links them to payments. In V1 it writes to Google Sheets.

4.1 Sheet design

Add a Bookings sheet with these columns:

| created_at | booking_id | service_id | service_name_de | service_name_en | customer_name | customer_email | customer_phone | message | lang | total_amount_chf | deposit_amount_chf | final_amount_chf | status | deposit_paid_at | final_paid_at | options (JSON) |

booking_id – generate a unique string (e.g. bkg_<YYYYMMDDHHmmss>_<rand4>).

status – one of PENDING_DEPOSIT, DEPOSIT_PAID, READY_FOR_FINAL, FINAL_PAID, CANCELED.

options – JSON string for optional add‑ons (e.g. rush, extra hours).

4.2 API endpoint

POST /api/bookings

Accepts JSON:

{
  "service_id": "svc_design_workshop",
  "customer_name": "Pascal Heiniger",
  "customer_email": "pascal@example.com",
  "customer_phone": "+41 76 ...",
  "message": "Can we discuss scope first?",
  "lang": "de",
  "options": { "rush": true }
}

Steps:

Validate input using your schema.

Look up the service by service_id from your services sheet.

Compute deposit and final amounts: 50 % each of price_chf (use Math.round() to 0.05 or 0.10 increments if you want Swiss rounding). Optionally apply add‑on pricing logic.

Insert a row into Bookings with status = PENDING_DEPOSIT and store deposit/final amounts.

Call paymentProvider.createCheckout({ booking_id, amount: deposit_amount_chf, currency: 'CHF', stage: 'DEPOSIT' }). This should set a Payrexx reference equal to payment_id and link it back to the booking.

Return { ok: true, booking_id, checkout_url }.

The client uses checkout_url to redirect to Payrexx. Do not rely on query parameters in the Payrexx redirect—webhook confirmation is the source of truth.

4.3 AI schema

Expose a schema for bookings similar to:

{
  "name": "bookings",
  "required": ["service_id", "customer_name", "customer_email"],
  "properties": {
    "service_id": "string",
    "customer_name": "string",
    "customer_email": "string(email)",
    "customer_phone": "string(optional)",
    "message": "string(optional)",
    "lang": "enum(de,en)",
    "options": "object(optional)"
  }
}

The AI can generate a multi‑step form using this schema.

5. Payment Module (Payrexx Integration)
5.1 Payrexx API usage

Use the Payrexx API
 to create payment links programmatically. Store these secrets in Vercel env variables:

PAYREXX_INSTANCE – your Payrexx instance name.

PAYREXX_API_KEY – API key from Payrexx.

PAYREXX_WEBHOOK_SECRET – secret token to verify incoming webhooks.

5.2 Payment creation

Expose POST /api/payments/create (called by the bookings module). Implementation:

Accept JSON: { booking_id, amount, currency, stage } – stage is DEPOSIT or FINAL.

Generate payment_id (e.g. pay_<timestamp>_<rand4>).

Call Payrexx “Create Invoice” or “Payment Gateway” API with:

amount = deposit or final amount.

currency = CHF.

reference = payment_id (to match at webhook).

purpose = "Service deposit for booking {booking_id}".

success_url = https://your-site.com/payment/success?booking_id={booking_id}&stage=DEPOSIT.

cancel_url = https://your-site.com/payment/cancel?booking_id={booking_id}&stage=DEPOSIT.

notify_url = https://your-api.com/api/payments/webhook.

fields (optional) – embed minimal data like booking_id or customer name.

Create a row in Payments sheet with status PENDING, stage, booking_id, amount.

Return checkout URL.

5.3 Webhook

Expose POST /api/payments/webhook. Implementation:

Verify PAYREXX_WEBHOOK_SECRET (Payrexx sends it in header or body). If invalid, respond 401.

Extract payment_id and status from webhook body. Mark the payment row in Payments as PAID if successful.

Look up the booking row by booking_id (one field in the payment row). If stage is DEPOSIT, set booking status to DEPOSIT_PAID and record deposit_paid_at = now. If stage is FINAL, set FINAL_PAID and record final_paid_at.

Send an email to you and optionally to the customer. (Use Gmail/Resend provider; can be added later.)

Respond with { ok: true }.

5.4 Final payment initiation

Expose POST /api/payments/create-final (admin‑triggered). Implementation:

Accept { booking_id }.

Verify booking status is DEPOSIT_PAID and compute final amount.

Call /api/payments/create with stage FINAL and return checkout URL.

You send this link to the customer manually or via a button in admin dashboard.

5.5 AI schema for payment creation

Although AI likely won’t create payments directly, you can still expose minimal schema:

{
  "name": "paymentCreate",
  "required": ["booking_id", "amount", "currency", "stage"],
  "properties": {
    "booking_id": "string",
    "amount": "number",
    "currency": "enum(CHF)",
    "stage": "enum(DEPOSIT,FINAL)"
  }
}
6. Contact Module
6.1 Data source

Add a Contacts sheet with:

| created_at | name | email | message | lang | consent | status | source | ip_hash |

Fields:

status – NEW, HANDLED, SPAM. You can filter by this later.

consent – whether the user agreed to receive updates (GDPR compliance).

source – website or other channel.

ip_hash – store a hashed IP (to implement a simple rate limiter/honeypot later).

6.2 API endpoint

POST /api/contact

Accepts JSON:

{
  "name": "Pascal Heiniger",
  "email": "pascal@example.com",
  "message": "I'd like to know more about your services.",
  "lang": "en",
  "consent": true
}

Steps:

Validate using schema: name, email, message required; lang optional; consent optional boolean.

Append to Contacts sheet with status NEW.

Send you an email containing the lead info (optional; can be done with Gmail provider).

Return { ok: true }.

6.3 AI schema

Expose a schema similar to:

{
  "name": "contact",
  "required": ["name", "email", "message"],
  "properties": {
    "name": "string",
    "email": "string(email)",
    "message": "string",
    "lang": "enum(de,en)",
    "consent": "boolean(optional)"
  }
}
7. Deployment and environment
7.1 Vercel serverless

Deploy the API functions to Vercel. Each module should reside in an /api/<module> file. Use Node.js with ES modules or TypeScript (compiling down to ESM) so you can keep the .js extension in the dynamic imports. Vercel automatically picks up the files under /api and creates serverless functions.

7.2 Environment variables

Store credentials in Vercel’s environment:

GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 – Base64‑encoded service account for Sheets access. Use domain‑wide delegation if needed.

GOOGLE_LEADS_SHEET_ID – ID of the Sheets file storing services, bookings, payments, and contacts.

PAYREXX_INSTANCE, PAYREXX_API_KEY, PAYREXX_WEBHOOK_SECRET – Payrexx credentials.

EMAIL_PROVIDER_API_KEY, EMAIL_PROVIDER_DOMAIN (if using Resend or other mail service).

FEATURES – optional JSON string overriding feature registry per environment.

7.3 Local development

Pull .env.example and populate with test data and dummy keys.

Use vercel dev or node to run local functions for testing.

Use a test Payrexx environment if possible; otherwise set the payment provider to “test mode” to avoid real transactions.

7.4 Authentication and spam control

Use a simple hidden honeypot field on the contact/booking forms to catch bots.

Implement a basic rate limiter by hashing IP addresses and storing them in ip_hash column. Limit per IP per hour/day.

8. AI machine layer

At this stage, the AI machine layer is mostly about exposing schemas and capabilities rather than generating responses automatically. Keep it lean:

/api/capabilities – global entry point for AI and front‑end generation.

/api/ai/schema/<module> – returns minimal JSON definitions for each module.

(Optional) /api/ai/meta – return a compact version of capabilities + version for ultra‑compact summarization.

The AI can then generate forms automatically, map the fields to your modules, and handle errors by reading your error responses.

Do not generate AI replies in V1; instead focus on the clarity of the machine interface.

9. Testing and manual workflow

Create a service in Sheets with id svc_brand_design, price CHF 200, etc.

Trigger a booking via your site’s form.

Verify a row is added to Bookings with PENDING_DEPOSIT status.

Verify a row is added to Payments with stage DEPOSIT and PENDING status.

Complete Payrexx checkout; ensure webhook flips both the payment row to PAID and booking row to DEPOSIT_PAID.

Trigger final invoice via your admin button; ensure second payment row is created and booking status becomes READY_FOR_FINAL then FINAL_PAID after final payment.

Check /api/capabilities and /api/ai/schema/bookings responses with Postman or similar; ensure they are compact and match the described shapes.

10. Future proofing hooks

While this blueprint is lean, it leaves room for growth:

Newsletter – add a module when ready; store emails in a Newsletter tab; integrate Brevo or Mailchimp provider via provider layer; add feature flag.

AI drafts – once AI drafts prove valuable on Pinte, implement the aiDraft module by adding an optional call in contact and bookings modules. Always include the original form payload and suggestions in the internal email.

Supabase – when scaling beyond 10–20 clients, swap dbProvider to Supabase by implementing createRow etc. Keep the same schema and business logic; migrate the data from Sheets once.

Events module – add an events tab in Sheets and endpoints for reading/updating; register event attendees via booking module.

Admin dashboards – once multiple clients are on board, build an admin UI that reads from the Sheets (or DB) to manage bookings, payments, events, etc.

Multi‑tenant – add tenant_id column to each row; add tenant prefix in API paths; use Vercel’s edge config or JWT to route.

Swiss data residency – later deploy the engine to a Swiss host (Supabase or self‑hosted Postgres) and keep the same API contract by swapping providers.

By following this blueprint, you can build your own site quickly, prove the AI integration concept, and create a strong foundation for future expansions without rewriting large portions of code.