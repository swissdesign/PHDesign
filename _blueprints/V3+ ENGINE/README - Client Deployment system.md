Doc 10 — Client Deployment System

(How you spin up new client sites quickly using the engine)

This document describes the deployment workflow that allows you to build and launch new client websites quickly, consistently, and safely using your backend engine.

The objective is simple:

Reduce a new client project to configuration, not engineering.

You should never rebuild infrastructure for each client.

Instead, you deploy the engine and configure it.

1. The Deployment Philosophy

A new client website should require:

• minimal code changes
• mostly configuration
• fast deployment
• predictable architecture

The deployment pipeline should look like this:

client idea
   │
   ▼
frontend design
   │
   ▼
engine template
   │
   ▼
configuration
   │
   ▼
deployment

Infrastructure remains the same every time.

2. The Template Repository

Your engine should live inside a template repository.

Example:

engine-template/

Directory structure:

api/
src/server/
contracts/
docs/
frontend/

This repository contains:

• backend modules
• AI Machine Layer
• payment integrations
• adapters
• example frontend

When starting a client project you simply:

clone template
3. Client Project Structure

Each client project follows the same layout.

Example:

client-pinte/
client-hotel/
client-ski-school/

Inside:

frontend/
config/
api/ (engine)

Config folder contains client-specific configuration.

4. Configuration System

The most important concept is the configuration file.

Each site has:

config/site.json

Example:

{
  "site_name": "Pinte Andermatt",
  "default_language": "de",
  "currency": "CHF",
  "modules": {
    "cms": true,
    "booking": true,
    "payments": true,
    "events": true,
    "newsletter": false
  },
  "payments": {
    "provider": "payrexx"
  }
}

This file determines how the engine behaves.

No code changes required.

5. Environment Variables

Secrets must be stored in environment variables.

Example variables:

GOOGLE_CMS_SHEET_ID
GOOGLE_LEADS_SHEET_ID
PAYREXX_API_KEY
PAYREXX_WEBHOOK_SECRET
OPS_ADMIN_SECRET

These are configured in Vercel project settings.

Each client site has its own values.

6. Data Sources

Each client has their own data storage.

Examples:

Client A → Google Sheets A
Client B → Google Sheets B
Client C → Supabase project C

Because of the adapter pattern, the backend modules do not change.

7. Deployment Platform

For now your deployment platform is:

Vercel

Advantages:

• serverless functions
• automatic scaling
• easy environment variables
• GitHub integration

Each client site becomes a separate Vercel project.

8. Deployment Pipeline

The deployment workflow should be standardized.

Steps:

clone template repo

customize frontend design

configure config/site.json

create Google Sheets backend

set environment variables

deploy to Vercel

Total setup time should eventually become:

< 1 day
9. Data Initialization

For new clients you create a starter sheet template.

Example Google Sheets templates:

CMS_TEMPLATE
LEADS_TEMPLATE

These include:

services
events
contacts
bookings

You simply copy the template for each new client.

10. Frontend Customization

Frontends are the only part that varies significantly.

Possible frontend sources:

• custom React build
• Astro site
• AI-generated frontend
• Framer export

But all frontends talk to the same APIs.

11. Client Module Selection

Different clients need different features.

Example restaurant:

cms
events
booking
contact

Example consultant:

cms
contact
payments
booking

Example hotel:

cms
booking
payments
crm
newsletter

Feature flags allow you to control this.

12. Domain Setup

Each client has their own domain.

Example:

clientdomain.com

DNS points to Vercel deployment.

No infrastructure changes required.

13. Monitoring Client Systems

Each deployed engine should include:

• logging
• smoke tests
• health checks

The AI Machine Layer can run diagnostics.

Example operation:

POST /api/_ops/run
{
action: "smoke_test"
}

This verifies system health.

14. Updates to the Engine

As you improve modules, you will want to update client projects.

There are two approaches.

Option 1 — Monorepo

All clients use the same codebase.

Advantages:

• easy updates

Disadvantages:

• less isolation

Option 2 — Independent Repos (recommended early)

Each client has its own repository cloned from the template.

Advantages:

• safer deployments
• client-specific customization

You manually merge improvements.

15. Client Feature Add-Ons

You can monetize additional modules.

Example:

Basic package:

cms
contact

Add-on modules:

booking
payments
newsletter
events

Each module adds value.

16. Billing Model

Your service could follow this structure.

Example:

setup fee
monthly hosting
optional add-on modules

Example pricing logic:

Basic website
Booking system
Payment integration
Newsletter automation

Each module becomes a product.

17. Client Dashboard (Future)

Eventually you may build a simple admin dashboard.

Capabilities:

• view leads
• view bookings
• toggle features
• run diagnostics

The AI Machine Layer already supports this concept.

18. Backup Strategy

Each client should have:

• database backups
• environment variable backups
• code repository backups

Google Sheets already provide basic version history.

Later Supabase provides automated backups.

19. Migration Strategy

If you move from Sheets to Supabase:

Steps:

export sheet data

import into database

switch adapter

redeploy

No frontend changes required.

20. The Real Goal of This System

This deployment system allows you to scale your work.

Instead of building websites manually each time, you operate a modular infrastructure platform.

The engine becomes the foundation.

The frontend becomes the customization layer.

Clients think they are buying websites.

In reality they are using your engine platform.

Final Thought

If you follow this deployment strategy carefully, you will achieve something extremely valuable:

A system where launching a new client project becomes configuration work, not engineering work.

That is the key to scaling without burning out.