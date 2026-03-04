Doc 11 — Development Discipline Guide

(How to keep the engine clean for years instead of turning it into technical debt)

This document is not about features.
It is about how you build.

Most systems fail not because the architecture was wrong, but because the discipline around the architecture collapses over time.

This guide defines the rules that keep your engine clean, stable, and scalable for many years.

1. The Core Philosophy

Your system should evolve like a machine with replaceable parts, not like a pile of custom hacks.

The guiding principle:

Improve the engine, not the project.

Every improvement should strengthen the reusable infrastructure.

Never build something that only benefits a single project unless absolutely necessary.

2. The “Module First” Rule

Whenever a new feature is needed, the first question must always be:

Is this a module?

If the answer is yes, build it as a reusable module, not as a project-specific feature.

Example:

Wrong approach:

Add restaurant booking logic inside the restaurant project.

Correct approach:

Create a booking module that supports restaurant bookings.

The difference determines whether your system becomes scalable or chaotic.

3. The “Engine Before Client” Rule

Client requests should never break architecture.

When a client asks for a feature:

Step 1
Determine whether the feature belongs in an existing module.

Step 2
If not, create a new module.

Step 3
Add configuration to enable it for that client.

Never add random code directly to a client project.

4. The “Stable Contracts” Rule

Your API contracts are sacred.

Once an endpoint is used by frontends, do not break its structure.

If change is required, introduce versioning.

Example:

/api/booking?v=1
/api/booking?v=2

Breaking contracts causes hidden failures in production.

Stable contracts make the system reliable.

5. The “Thin API” Rule

The API layer must remain minimal.

Endpoints should only:

• validate input
• call module logic
• return responses

Business logic belongs in modules.

Example:

Bad API code:

calculate deposit
update database
send email
generate payment

Correct API code:

validate request
call booking module
return result

Thin APIs are easier to maintain.

6. The “Replaceable Data Layer” Rule

Your data storage should always remain replaceable.

Modules must never assume a specific database.

Instead they use adapters.

Example adapter:

db.getServices()
db.saveBooking()
db.updatePayment()

Whether this calls:

Google Sheets

or:

Supabase

the module does not care.

This keeps migrations painless.

7. The “No Secrets in Code” Rule

Secrets must never appear in code.

Secrets belong in environment variables.

Examples:

PAYREXX_API_KEY
EMAIL_API_KEY
OPS_ADMIN_SECRET

This protects both security and maintainability.

8. The “Consistent Error Model” Rule

All errors must follow the same format.

Example:

{
  ok: false,
  error: {
    code: "BOOKING_NOT_FOUND",
    message: "Booking could not be located."
  }
}

Never return random error formats.

Consistency improves debugging and AI compatibility.

9. The “Logging Everything Important” Rule

Systems fail silently when logging is ignored.

Always log:

contact_received
booking_created
payment_received
email_sent
webhook_failed

Logs are the only reliable way to diagnose production problems.

10. The “Feature Flag Everything” Rule

Every module should support feature flags.

Example:

booking_enabled
newsletter_enabled
events_enabled
chatbot_enabled

This allows:

• easy testing
• gradual rollouts
• client-specific configurations

Feature flags prevent risky deployments.

11. The “Configuration Over Code” Rule

Prefer configuration instead of code changes.

Example:

Bad approach:

Hard-code payment provider for a client.

Better approach:

Set payment_provider in config.json

Configuration-driven systems are easier to maintain.

12. The “Document as You Build” Rule

Documentation must evolve with the code.

Minimum documentation:

• module purpose
• API contracts
• environment variables
• deployment steps

Future you (and future AI tools) will rely heavily on documentation.

13. The “Small Commits” Rule

Large commits are dangerous.

Use small commits that describe exactly what changed.

Example:

Good commit messages:

feat: add booking module
fix: handle Payrexx webhook retry
refactor: move email logic to adapter

Avoid vague commits like:

fix stuff
update code

Clear commit history helps long-term maintenance.

14. The “Test Real Workflows” Rule

Instead of writing artificial tests, test real user flows.

Important flows include:

• submitting contact forms
• booking services
• completing payments
• webhook processing

These workflows reveal real problems faster.

15. The “One Way In, One Way Out” Rule

Every system action should follow a predictable path.

Example:

Contact flow:

frontend → /api/contact → contact module → database → email

Avoid alternate paths.

Consistency reduces bugs.

16. The “No Hidden Dependencies” Rule

Modules should never depend on undocumented behavior.

Example:

Bad dependency:

Booking module assumes CMS fields exist.

Better approach:

Booking module requests service data through CMS module API.

This keeps modules independent.

17. The “Avoid Premature Complexity” Rule

Do not introduce complex infrastructure too early.

Examples of unnecessary early complexity:

microservices
kubernetes
message queues
distributed caching

Vercel serverless functions are sufficient for a long time.

Complex infrastructure should only appear when truly needed.

18. The “Refactor Before Expanding” Rule

Whenever a module becomes messy, refactor it before adding new features.

Messy modules lead to exponential complexity later.

Small refactors keep the system healthy.

19. The “Protect the AI Layer” Rule

The AI Machine Layer must remain simple and stable.

Never overload it with business logic.

Its job is only:

inspection
contracts
diagnostics
safe operations

Everything else belongs in modules.

20. The Long-Term Discipline

Your engine should improve gradually over time.

The discipline cycle is:

build → observe → refine → document → repeat

This approach prevents technical debt from accumulating.

Final Thought

Most systems fail because they grow faster than their architecture.

Your goal is different.

You are building a long-lived engine, not just a series of websites.

By following these development disciplines, the engine can evolve cleanly for many years.

That is what allows small teams to build infrastructure that scales far beyond their size.