Doc 7 — System Architecture & Mental Model

(How the whole system fits together so it never becomes messy)

This document is less about code and more about how to think about the system you are building.

If you keep this mental model clear, your engine will stay simple, scalable, and AI-friendly instead of turning into a tangled mess.

1. The Core Architecture

Your system consists of four layers.

Think of it like a building:

┌───────────────────────────────┐
│        Frontend Layer         │
│  (React / Astro / AI built)   │
└───────────────▲───────────────┘
                │
┌───────────────┴───────────────┐
│        API Layer              │
│     (Serverless functions)    │
└───────────────▲───────────────┘
                │
┌───────────────┴───────────────┐
│       Module Engine           │
│   CMS | Booking | Contact     │
│   Payments | Events | etc     │
└───────────────▲───────────────┘
                │
┌───────────────┴───────────────┐
│        Data Layer             │
│  Google Sheets → Supabase    │
└───────────────────────────────┘

And alongside this sits the AI Machine Layer.

                ┌─────────────────────┐
                │   AI Machine Layer  │
                │ contracts / ops / UI│
                └─────────────────────┘

The AI layer can observe and operate the engine safely.

2. The Golden Rule of This Architecture

Frontend never talks to the database.

Frontend only talks to:

/api/*

This prevents chaos.

3. Responsibilities of Each Layer
Frontend Layer

Responsible for:

UI

animations

layout

language switching

displaying data

It should not contain business logic.

Example:

Frontend shows:

Book Service

But the frontend does not calculate deposit amounts.

The backend does that.

API Layer

The API layer is the gateway.

Endpoints:

/api/cms
/api/contact
/api/booking
/api/payments/create
/api/payments/webhook

Responsibilities:

validate input

call modules

return JSON responses

The API layer should remain very thin.

Module Engine

This is the heart of the system.

Modules are reusable components.

Examples:

CMS module
Contact module
Booking module
Payments module
Events module
Newsletter module

Modules contain:

logic
data operations
integration code

They do not know about the frontend.

Data Layer

The data layer is replaceable.

Initially:

Google Sheets

Later:

Supabase

Because of adapters, the modules never know which database they use.

4. Adapter Pattern (Important Concept)

Your modules talk to an adapter interface, not the database directly.

Example:

cms.getServices()

Internally that calls:

googleSheets.readServices()

Later it could call:

supabase.queryServices()

Modules do not care.

This is how you avoid painful migrations.

5. AI Machine Layer

This layer is unique.

It allows AI systems to understand and interact with your backend.

Endpoints:

/api/_meta/modules
/api/_meta/contracts
/api/_meta/ai-ui
/api/_ops/run

AI tools can:

inspect available modules

read schemas

see system health

trigger safe operations

This turns your backend into AI-operable infrastructure.

6. Request Flow Example

Example: booking a service.

Step 1 — frontend

User clicks:

Book Service

Frontend sends:

POST /api/booking

Step 2 — API layer

Validates input.

Calls module:

booking.createBooking()

Step 3 — module

Module:

loads service from CMS

calculates deposit

writes booking

requests payment link

Step 4 — payment module

Calls Payrexx API.

Returns payment link.

Step 5 — frontend

Redirects user to Payrexx.

7. Payment Flow Architecture

Payment flow has two directions.

Direction 1 — Create payment
Frontend → booking API → payments module → Payrexx
Direction 2 — Webhook
Payrexx → webhook API → payments module → update booking

This separation is essential.

Never trust frontend payment confirmations.

Always trust the webhook.

8. Error Handling Model

All API responses follow the same format.

Success:

{
ok: true,
data: ...
}

Failure:

{
ok: false,
error: {
code: "...",
message: "...",
details: {...}
}
}

This consistency helps both frontend and AI tools.

9. Feature Flag System

Modules are enabled or disabled via feature flags.

Example config:

features.booking = true
features.events = false
features.newsletter = false

Benefits:

same engine runs different sites

easy add-on modules

easier testing

10. Multi-language Strategy

Language logic belongs to backend CMS module.

Services sheet contains:

title_de
title_en
description_de
description_en

CMS module returns language-specific fields.

Frontend never chooses columns.

11. Email Flow

Contact requests follow this pipeline.

User → contact API
      → store lead
      → send internal email
      → send auto reply

Future AI draft system fits here.

12. Observability

Important events should always be logged.

Examples:

contact_received
booking_created
payment_success
webhook_error

Logs go to:

Vercel logs

Later you could add a log module.

13. Scaling Strategy

Your architecture scales horizontally.

Each client site runs the same engine.

Client A
Client B
Client C

Each has:

same backend modules
different config
different data source

You improve the engine once and all clients benefit.

14. Where Complexity Can Appear

These areas tend to become messy if not controlled:

Email integrations

SMTP vs Gmail API vs Resend.

Payment systems

Webhooks must be reliable.

Authentication

Adding user logins increases complexity.

AI automation

Must always have human override.

15. Simplicity Principle

Every module should follow this rule:

one module
one responsibility

Examples:

Contact module handles leads.

Booking module handles bookings.

Payments module handles payments.

Never mix them.

16. The System in One Sentence

Your system is:

A modular backend engine with an AI-operable interface powering frontend websites.

17. Mental Checklist When Adding Features

Whenever you add something, ask:

Is this a module?

Does it belong in the API layer?

Does it belong in the frontend?

Does it belong in the AI layer?

If the answer is unclear, rethink the design.

18. Long-Term Vision

Eventually the architecture allows you to build websites like this:

Frontend (AI generated)
        │
        ▼
Backend Engine (your system)
        │
        ▼
Data (Supabase)

The frontend becomes interchangeable.

The engine becomes the real product.

19. Practical Advice

Your biggest risk is overbuilding too early.

The correct sequence remains:

ship V1
use it on real projects
observe patterns
refine modules

Do not try to build the perfect platform now.

Build the first working engine.

20. Key Insight

Your advantage is not code.

Your advantage is architecture.

Most developers write code.

Few design systems that stay clean for years.