Doc 8 — The Module Library

(Complete design of the modular backend system)

This document defines the module ecosystem your engine can support over time.

The goal is to ensure that as your system grows, you never build features randomly.
Instead, every new capability becomes a clean, reusable module.

Think of the engine as a modular machine.
Each module is a self-contained component that plugs into the system.

1. What a Module Is

A module is a backend capability that:

• exposes API endpoints
• manages its own data
• integrates with external services if needed
• can be enabled or disabled via feature flags

Every module has:

module/
  routes.ts
  logic.ts
  schema.json
  config.ts
  featureFlag

Example:

modules/booking
modules/events
modules/newsletter
modules/payments
2. Rules Every Module Must Follow

To keep the system clean, modules follow strict rules.

Rule 1 — Single responsibility

Each module solves one problem only.

Example:

Booking module handles bookings.
Payments module handles payments.

They communicate but never merge logic.

Rule 2 — API first

Modules expose APIs.

Frontend never accesses module internals.

Rule 3 — Config driven

Modules read configuration from:

env variables
config tables
feature flags

This makes them reusable.

Rule 4 — Adapter pattern

Modules never directly talk to databases.

Instead they use adapters:

dbAdapter
emailAdapter
paymentAdapter
storageAdapter

This makes migrations easy.

3. Core Modules (The Foundation)

These are modules every site will likely use.

Module 1 — CMS

Purpose:

Manage content.

In early versions content comes from Google Sheets.

Later it can come from Supabase or a CMS dashboard.

Data examples:

services
portfolio
pages
blog posts
config

Endpoints:

GET /api/cms
GET /api/cms/services
GET /api/cms/page

Responsibilities:

• localization
• caching
• formatting data for frontend

Module 2 — Contact

Handles incoming contact requests.

Data stored in:

Contacts table

Endpoints:

POST /api/contact
GET /api/contact/admin

Actions:

1 store lead
2 notify internal email
3 send auto reply

Future:

AI response drafts.

Module 3 — Booking

Handles service bookings.

Examples:

• consulting sessions
• design services
• restaurant tables
• ski lessons

Endpoints:

POST /api/booking
GET /api/booking

Responsibilities:

• booking validation
• availability logic
• payment trigger

Module 4 — Payments

Handles payments and webhooks.

Integrations may include:

Payrexx
Stripe
PayPal

Endpoints:

POST /api/payments/create
POST /api/payments/webhook

Responsibilities:

• create payment links
• verify webhook signatures
• update booking/payment records

Module 5 — Email

Handles sending emails.

Adapters allow switching providers.

Possible providers:

Resend
Postmark
SMTP
Gmail API

Endpoints:

internal service only

Capabilities:

• templated emails
• notifications
• auto replies

Module 6 — Media

Handles files such as:

images
documents
videos

Possible storage:

Cloudflare R2
S3
Supabase storage

Endpoints:

POST /api/media/upload
GET /api/media

Future capability:

AI image tagging.

4. Expansion Modules (High Value)

These modules can be added when needed.

Module 7 — Events

Used by:

restaurants
clubs
venues
conferences

Data:

events
event dates
tickets

Endpoints:

GET /api/events
POST /api/events

Future integration:

Google Calendar
ICS export
Module 8 — Newsletter

Handles mailing lists.

Capabilities:

subscribe
unsubscribe
campaigns

Endpoints:

POST /api/newsletter/subscribe
POST /api/newsletter/unsubscribe

Integrations:

Mailchimp
Resend
Sendgrid
Module 9 — CRM

Lightweight customer database.

Stores:

leads
customers
notes
history

Capabilities:

lead tracking
status updates
internal notes

This module connects:

contact module
booking module
payments module

Module 10 — Chatbot

Provides automated chat.

Possible integrations:

OpenAI
Anthropic
local models

Capabilities:

• answer questions
• guide bookings
• collect leads

AI always writes into the CRM.

Module 11 — Analytics

Provides basic site metrics.

Examples:

visits
conversion rate
form submissions
bookings

Data sources:

Plausible
PostHog
custom logs

Endpoints:

GET /api/analytics
Module 12 — Authentication

Allows user accounts.

Possible use cases:

client portals
staff dashboards
admin areas

Endpoints:

POST /api/auth/login
POST /api/auth/logout
GET /api/auth/session

Future integration:

OAuth
Magic links
Passkeys
Module 13 — Membership

Allows paid memberships.

Use cases:

clubs
online communities
training programs

Capabilities:

member accounts
subscription payments
content access control
5. Operational Modules

These modules keep the system healthy.

Module 14 — Logs

Stores important system events.

Examples:

payment success
email sent
errors

Later logs can be searchable.

Module 15 — Queue

Handles background jobs.

Use cases:

sending emails
AI processing
data synchronization

Possible technologies:

Upstash
Redis
BullMQ
Module 16 — Scheduler

Runs tasks automatically.

Examples:

daily newsletter
weekly reports
cleanup jobs
6. AI Modules

These modules support AI automation.

Module 17 — AI Draft

Generates suggested replies.

Workflow:

lead received
AI drafts response
human approves
email sent
Module 18 — AI Insights

Analyzes system data.

Examples:

which services convert best
what questions customers ask
which days bookings spike
7. AI Machine Layer (Special Module)

This module exposes system information.

Endpoints:

/api/_meta/modules
/api/_meta/contracts
/api/_meta/ai-ui
/api/_ops/run

Capabilities:

AI inspection
AI configuration
AI diagnostics

8. Module Dependency Graph

Modules interact but remain independent.

Example flow:

Contact → CRM
Booking → Payments
Payments → CRM
Newsletter → CRM

Graphically:

CRM
 ↑  ↑  ↑
 |  |  |
Contact Booking Newsletter
      |
   Payments
9. Feature Flag Control

Modules can be enabled or disabled.

Example config:

booking_enabled = true
newsletter_enabled = false
events_enabled = true
chatbot_enabled = false

Frontend reads flags and hides UI accordingly.

10. Client Configuration

Every site built on the engine has:

config.json

Example:

site_name
default_language
currency
enabled_modules
payment_provider
email_provider

This config drives the entire system.

11. Why This Module Library Matters

Without a module plan, systems slowly become messy.

With this library:

You know exactly where every feature belongs.

This prevents:

duplicated logic
broken integrations
unmaintainable code

12. How the System Evolves

At first you only use a few modules.

V1:

CMS
Contact
Booking
Payments
AI Machine Layer

Later:

Newsletter
Events
CRM

Later still:

Chatbot
Membership
Analytics

The architecture already supports them.

13. The Real Product

Your clients think they are buying a website.

But what they are actually using is:

a modular digital infrastructure system.

The website is only the interface.

14. Your Strategic Advantage

Most agencies rebuild systems for each client.

You improve one engine.

Every client benefits from improvements.

That is how you scale efficiently.

15. The Most Important Discipline

Never break the architecture.

Always ask:

Is this a module?
Which module owns this?

If you follow that rule, the engine will remain clean for years.