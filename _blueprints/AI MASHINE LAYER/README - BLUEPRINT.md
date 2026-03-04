AI Machine Layer Blueprint

Purpose: Make your backend engine self-describing, self-auditable, and AI-operable through a strict contract + a machine-first “AI Admin UI representation” (not a human dashboard).

1) What the AI Machine Layer is

The AI machine layer is a thin interface standard that sits between:

Frontends (Astro/Vite/React/Framer/WeWeb/AI-generated HTML)

Engine modules (contact, bookings, events, newsletter, payments, AI drafts, etc.)

Data adapters (Google Sheets, Supabase/Postgres, etc.)

It provides:

Contracts (schemas, validation rules, expected fields)

Discoverability (which modules exist and what they do)

Operability (how to safely change config, enable modules, run actions)

AI Admin UI representation (a canonical JSON “UI spec” that describes what’s editable/visible/triggerable, in a machine-readable way)

The AI doesn’t need to read your code to work with the system. It reads the contract and UI spec.

2) Design goals (non-negotiable)
2.1 “AI sees a control panel, not a codebase”

The AI should be able to:

understand the site capabilities

see current feature states (enabled/disabled)

view required environment/config values (redacted)

test endpoints

run safe admin actions (sync gallery, calendar sync, send newsletter preview)

inspect logs and failure reasons

propose a change plan using the contract vocabulary

2.2 Extreme predictability

Everything must be:

versioned

typed

stable

low-ambiguity

consistent naming conventions

2.3 Security-first

The AI layer can be powerful, so it must include:

read vs write separation

role permissions

audit logging

dry-run mode

rate limits

explicit “unsafe operations blocked” defaults

3) Architecture overview

The AI machine layer consists of 4 artifacts:

3.1 Module Registry

A single endpoint that lists:

modules installed

module versions

feature flags

required config keys

endpoints and schemas

capabilities and actions

Example endpoint:

GET /api/_meta/modules

3.2 Contract Pack

A versioned set of JSON schemas + examples:

request schemas for each endpoint

response schemas

error schema normalization

event schemas (calendar, newsletter, payment webhooks)

Suggested location:

/contracts/v1/*.schema.json

Exposed via:

GET /api/_meta/contracts?v=1

3.3 AI Admin UI Representation

A canonical JSON spec that describes:

“pages”

“panels”

“fields”

“toggles”

“actions”

“status indicators”

localization keys

Exposed via:

GET /api/_meta/ai-ui?v=1

This is not a React UI. It’s a structured config spec.

3.4 Admin Ops Endpoints

Safe, auditable endpoints for performing operations:

POST /api/_ops/run (action runner)

POST /api/_ops/config (update whitelisted config keys)

POST /api/_ops/feature (toggle modules)

GET /api/_ops/logs (recent operational logs)

Protected by:

admin secret / JWT / session

strict allowlists

4) The canonical “AI UI Spec” (the heart of C)

This is what makes an AI go:
“Ah. I know exactly what can be changed, what must not be touched, and how to test it.”

4.1 Spec shape (high level)
{
  "version": "1.0.0",
  "project": {
    "id": "pinte-club",
    "name": "Pinte Pub&Club",
    "defaultLocale": "de",
    "locales": ["de", "en", "fr", "it"]
  },
  "panels": [
    {
      "id": "features",
      "title_i18n": "admin.features.title",
      "blocks": [...]
    }
  ]
}
4.2 UI blocks types (standardize these)

Your spec should use a small set of block types:

status_card (read-only state)

toggle (feature flags)

field_group (editable config values)

action_button (runs an admin action)

table_preview (read-only preview of data rows)

log_view (recent errors + traces)

test_runner (smoke test buttons)

doc_link (links to internal docs)

Keep the set small so the AI learns it instantly.

4.3 Example: Features panel
{
  "id": "features",
  "type": "panel",
  "title_i18n": "admin.features.title",
  "blocks": [
    {
      "id": "features.core",
      "type": "toggle_group",
      "toggles": [
        {
          "key": "features.contact.enabled",
          "label_i18n": "feature.contact",
          "default": true,
          "requires": ["config.google.leads_sheet_id"],
          "dependsOn": []
        },
        {
          "key": "features.reservation.enabled",
          "label_i18n": "feature.reservation",
          "default": true,
          "requires": ["config.google.leads_sheet_id"],
          "dependsOn": []
        },
        {
          "key": "features.ai_draft.enabled",
          "label_i18n": "feature.ai_draft",
          "default": false,
          "requires": ["config.ai.endpoint", "config.ai.secret"],
          "dependsOn": ["features.contact.enabled"]
        }
      ]
    }
  ]
}

This instantly tells an AI:

what exists

what is enabled

what it depends on

what config it needs

4.4 Example: Config panel (redacted fields)

The AI should see whether values exist, but not secrets.

{
  "id": "config.google",
  "type": "field_group",
  "title_i18n": "admin.config.google",
  "fields": [
    {
      "key": "config.google.cms_sheet_id",
      "label_i18n": "config.cms_sheet_id",
      "valueState": "set",
      "sensitivity": "low",
      "editable": true,
      "validation": { "type": "string", "pattern": "^[a-zA-Z0-9_-]{20,}$" }
    },
    {
      "key": "config.google.service_account",
      "label_i18n": "config.service_account",
      "valueState": "set",
      "sensitivity": "secret",
      "editable": true,
      "input": "textarea",
      "redact": true
    }
  ]
}
4.5 Example: Action runner panel
{
  "id": "ops.actions",
  "type": "panel",
  "title_i18n": "admin.ops.title",
  "blocks": [
    {
      "id": "ops.smoke",
      "type": "test_runner",
      "tests": [
        { "id": "smoke.cms", "label": "GET /api/cms", "method": "GET", "path": "/api/cms" },
        { "id": "smoke.contact", "label": "POST /api/contact", "method": "POST", "path": "/api/contact", "schemaRef": "contact.request" }
      ]
    },
    {
      "id": "ops.calendar",
      "type": "action_button",
      "label_i18n": "action.calendar_sync",
      "actionId": "calendar.syncUpcoming",
      "requires": ["features.calendar_sync.enabled"]
    }
  ]
}

This allows an AI to “operate” your backend in a controlled way.

5) Contract conventions (make it insanely AI-friendly)
5.1 Naming conventions

Modules: contact, reservation, cms, events, newsletter, payments, ai

Endpoints: /api/{module}/{action?}

Config keys: config.{domain}.{name}

Feature flags: features.{module}.enabled

Actions: {module}.{verb}{Noun} like calendar.syncUpcoming

5.2 One error schema everywhere

All endpoints must return:

{ "ok": false, "error": { "code": "...", "message": "...", "details": {...} } }

Even if internal error differs, normalize externally.

5.3 Every request/response has:

schema

example

explanation text (short)

“gotchas”

localization notes

5.4 Localization metadata

For multilingual sites, every field in UI spec uses label_i18n.
Contracts should include:

“language behavior”

fallback rules

required translations vs optional

6) How the AI uses it (workflow)

When an AI is asked: “Add a booking modal” or “Move to Supabase,” it should:

GET /api/_meta/modules

see available modules and current states

GET /api/_meta/ai-ui

see what’s configurable and which actions exist

GET /api/_meta/contracts

learn request/response requirements

Run smoke tests via /api/_ops/run (optional)

Propose changes in terms of toggles/config/actions, not “random code edits”

If code changes are required, the AI can still do them, but the spec keeps it grounded.

7) Deployment model (where does this live?)
7.1 For now (serverless)

It ships inside the same repo

Deployed on Vercel

Protected endpoints:

_meta/* read-only can be public or semi-public

_ops/* must be locked behind admin auth

7.2 Later (multi-tenant engine)

If you build this for many clients:

each client has:

its own project config

its own feature entitlements

its own data adapter

_meta/ai-ui becomes tenant-aware

8) Minimal version (what you actually build first)

If you want V1 proof quickly, the minimal AI machine layer is:

GET /api/_meta/modules

GET /api/_meta/ai-ui

GET /api/_meta/contracts

A single protected operation endpoint:

POST /api/_ops/run (runs allowlisted actions)

That’s enough to make the backend “AI legible.”

9) Critical safety controls (don’t skip)
9.1 Allowlist operations only

No generic “execute code” endpoints.
Only action IDs you explicitly define.

9.2 Audit log everything

Every _ops/* call writes:

timestamp

actionId

actor (admin)

payload hash

result summary

error code if any

9.3 Dry-run mode

Every operation should support:

"dry_run": true
So the AI can verify outcome without causing changes.

10) Why this is the “bridge, not the Alps”

Because it standardizes:

what exists

what is allowed

how to configure

how to test

how to operate

Instead of an AI reading random files and guessing, it uses a clear “control panel” spec.

This is the key to scaling your process.