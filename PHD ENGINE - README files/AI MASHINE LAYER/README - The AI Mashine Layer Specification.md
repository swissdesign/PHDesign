Doc 9 — The AI Machine Layer Specification

(The AI-Readable Control Layer for Your Modular Backend Engine)

This document defines the AI Machine Layer — the component that makes your backend understandable and operable by AI systems.

This is arguably the most unique part of your architecture.

Most backends are built for humans only.

Your backend will be built so that both humans and AI can understand it instantly.

1. Purpose of the AI Machine Layer

The AI Machine Layer allows AI systems to:

• understand backend capabilities
• inspect system configuration
• read contracts (schemas)
• run safe diagnostics
• assist with operations
• help generate frontends

It does not allow AI to run dangerous operations.

Instead, it provides structured transparency.

Think of it like a diagnostic port on a machine.

2. Core Principle

The AI Machine Layer is read-first, operate-second.

AI must first understand the system before interacting with it.

The architecture enforces this order:

Inspect → Understand → Operate
3. Architecture Overview

The AI layer sits beside the API layer.

Frontend
   │
   ▼
API Layer
   │
   ▼
Module Engine
   │
   ▼
Data Layer

AI layer:

AI Machine Layer
 ├── contracts
 ├── module registry
 ├── system state
 └── operations runner
4. The Four AI Layer Endpoints

The entire AI interface consists of four core endpoints.

/api/_meta/modules
/api/_meta/contracts
/api/_meta/ai-ui
/api/_ops/run

These are intentionally simple.

5. Module Registry Endpoint
GET /api/_meta/modules

Purpose:

Return all modules installed in the system.

Example response:

{
  "version": "1.0",
  "modules": [
    {
      "name": "cms",
      "enabled": true,
      "version": "1.0",
      "routes": ["/api/cms"]
    },
    {
      "name": "booking",
      "enabled": true,
      "routes": ["/api/booking"]
    },
    {
      "name": "payments",
      "enabled": true,
      "routes": [
        "/api/payments/create",
        "/api/payments/webhook"
      ]
    }
  ]
}

This allows AI to instantly understand:

• what capabilities exist
• what endpoints belong to which modules

6. Contracts Endpoint
GET /api/_meta/contracts

Purpose:

Expose API schemas.

Schemas describe:

• request formats
• response formats
• error structures

Example:

{
  "contracts": {
    "booking.create": {
      "request": {
        "service_id": "string",
        "name": "string",
        "email": "string",
        "notes": "string"
      },
      "response": {
        "booking_id": "string",
        "payment_url": "string"
      }
    }
  }
}

AI can use this to:

• generate frontend forms
• validate API calls
• debug issues

7. AI UI Endpoint
GET /api/_meta/ai-ui

Purpose:

Provide a machine-readable admin dashboard structure.

This is essentially a virtual control panel.

Example structure:

{
  "panels": [
    {
      "title": "System Health",
      "type": "status",
      "items": [
        "cms",
        "payments",
        "email"
      ]
    },
    {
      "title": "Features",
      "type": "toggle",
      "items": [
        "booking",
        "newsletter",
        "events"
      ]
    },
    {
      "title": "Operations",
      "type": "actions",
      "items": [
        "run_smoke_test",
        "test_email",
        "test_payment"
      ]
    }
  ]
}

AI can interpret this as an interface.

This enables:

• automated diagnostics
• AI admin assistants
• future control panels

8. Operations Runner
POST /api/_ops/run

This endpoint allows controlled system actions.

It must always require an admin secret.

Example request:

{
  "action": "smoke_test",
  "token": "ADMIN_SECRET"
}

Example response:

{
  "ok": true,
  "result": {
    "cms": "ok",
    "email": "ok",
    "payments": "ok"
  }
}

Allowed operations may include:

smoke_test
test_email
test_payrexx
booking_dry_run
refresh_cache

This gives AI tools a safe way to diagnose systems.

9. Security Model

The AI Machine Layer must never expose secrets.

Secrets must be represented like this:

{
  "payrexx_api_key": {
    "state": "configured"
  }
}

Never:

show the actual key

Operations endpoint must require:

OPS_ADMIN_SECRET
10. Error Schema

All endpoints must return consistent errors.

Example:

{
  "ok": false,
  "error": {
    "code": "PAYMENT_PROVIDER_UNAVAILABLE",
    "message": "Payment provider could not be reached."
  }
}

Consistency makes AI debugging much easier.

11. Versioning

The AI layer must support versioning.

Example:

/api/_meta/contracts?v=1

When contracts change:

v2

This prevents breaking older frontends.

12. Example AI Workflow

Imagine an AI assistant analyzing your system.

Step 1 — inspect modules

GET /api/_meta/modules

Step 2 — inspect contracts

GET /api/_meta/contracts

Step 3 — inspect UI structure

GET /api/_meta/ai-ui

Step 4 — run diagnostics

POST /api/_ops/run

Within seconds the AI understands the backend.

13. Why This Matters

AI tools will increasingly generate frontends.

But those frontends need a predictable backend.

Your AI Machine Layer provides exactly that.

It becomes a translation layer between AI and infrastructure.

14. How This Helps You

When using AI tools:

Instead of explaining your backend every time, you can say:

"Inspect /api/_meta/*."

The AI immediately understands:

• endpoints
• schemas
• operations

This dramatically speeds up development.

15. Future Expansion

The AI Machine Layer could evolve into:

AI Admin Assistant
AI System Debugger
AI Integration Builder
AI Frontend Generator

All powered by the same interface.

16. The Philosophy Behind It

Your backend becomes a machine with an inspection port.

Humans can open the hood.

AI can open the hood.

Both see the same structure.

That is extremely powerful.

17. The Simplicity Rule

Despite all this power, the AI Machine Layer must remain small.

Never exceed:

4 endpoints

Complexity belongs in modules, not in the AI layer.

18. What Makes This System Special

Most backends are opaque.

Your backend becomes self-describing.

This is similar to how Kubernetes and GraphQL expose system metadata.

But your version is simpler and purpose-built for web infrastructure.

19. The Final Mental Model

Your system becomes:

Frontend
   │
   ▼
Backend Engine
   │
   ▼
AI Machine Layer
   │
   ▼
AI Systems

AI tools can safely interact with the engine.

This is the bridge between human-built infrastructure and AI-built interfaces.

20. The Key Takeaway

The AI Machine Layer is not about automation.

It is about clarity.

Clear systems scale.

Opaque systems collapse.

By making your backend transparent, you future-proof it.