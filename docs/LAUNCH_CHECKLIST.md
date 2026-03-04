# P. Heiniger Design - Backend Engine V1 Launch Checklist

This document outlines the exact, repeatable process for deploying the Astro Backend Engine for a new client. Follow these steps sequentially to configure the AI Machine Layer, Database links, and Payment gateways.

---

## 1. Google Cloud Platform (GCP) & Authentication

The engine uses Google Sheets as a low-latency CMS and Lead Database. We must establish a secure connection.

- [ ] **Create a GCP Project**: Go to the Google Cloud Console and create a new project (e.g., `client-name-phd-backend`).
- [ ] **Enable the Google Sheets API**: Navigate to **APIs & Services > Library** and enable "Google Sheets API".
- [ ] **Create a Service Account**:
  - Go to **IAM & Admin > Service Accounts**.
  - Create a new Service Account.
  - Generate a new JSON Key (this downloads a `.json` file to your computer).
- [ ] **Encode the JSON Key**:
  - Open your terminal.
  - Run: `base64 -i path/to/downloaded-key.json | pbcopy` (Mac) or equivalent.
  - This strings forms the exact value for `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` in your `.env`.

---

## 2. Google Sheets Setup (The Database)

We need a dedicated CMS and Leads sheet structured for the engine's adapters.

- [ ] **Duplicate the Templates**: Copy the standard `PHD CMS Template` and `PHD Leads Template` Google Sheets.
- [ ] **Grant Database Access**: 
  - Open each duplicated Sheet.
  - Click **Share**.
  - Invite the "Client Email" found inside your GCP Service Account `.json` file as an **Editor**.
- [ ] **Extract Sheet IDs**: 
  - Look at the URL of the Sheets: `https://docs.google.com/spreadsheets/d/[THIS_IS_THE_ID]/edit`
  - Save these IDs. They form the values for `GOOGLE_CMS_SHEET_ID` and `GOOGLE_LEADS_SHEET_ID`.

---

## 3. Payrexx Integration (Payments)

Configure the payment gateway to seamlessly catch deposits through the Booking module.

- [ ] **Create Payrexx Instance**: Set up the client's Payrexx account.
- [ ] **Extract API Keys**: 
  - In Payrexx, navigate to **API**.
  - Note the `Instance Name` (the subdomain of your Payrexx account).
  - Note the `API Secret`.
- [ ] **Configure Webhooks**:
  - Under API, find "Webhooks".
  - Add a new webhook pointing to production: `https://[client-domain.com]/api/payments/webhook`.
  - Copy the generated Webhook Secret.
- [ ] Save these three values for your `.env` as `PAYREXX_INSTANCE`, `PAYREXX_API_KEY`, and `PAYREXX_WEBHOOK_SECRET`.

---

## 4. Vercel Environment Variables (`.env.local`)

Deploy to Vercel and plug in the collected credentials safely into the Project Settings > Environment Variables.

```env
# Google Cloud
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64="ey..."
GOOGLE_CMS_SHEET_ID="your_cms_sheet_id_here"
GOOGLE_LEADS_SHEET_ID="your_leads_sheet_id_here"

# Payrexx Payments
PAYREXX_INSTANCE="your-instance-name"
PAYREXX_API_KEY="your-api-key"
PAYREXX_WEBHOOK_SECRET="your-webhook-secret"

# Internal Security
OPS_ADMIN_SECRET="generate_a_random_secure_string_here"
```

> **Note:** Generate `OPS_ADMIN_SECRET` using a secure generator (e.g., `openssl rand -hex 32`).

---

## 5. Verification: The Ops Runner

Once deployed to Vercel, verify the engine's integrity natively using the Secure Ops Runner. Do not skip this!

### Validate Environment Variables

Run this from your terminal to verify Vercel injected all properties successfully (without leaking strings):

```bash
curl -X POST https://[client-domain.com]/api/ops/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_OPS_ADMIN_SECRET]" \
  -d '{"actionId": "health.env"}'
```
*Expected Output: All environment variables listed should return `true`.*

### Validate the Database (Smoke Test)

Run this to verify the Service Account can successfully penetrate the CMS sheet and extract live JSON data grids:

```bash
curl -X POST https://[client-domain.com]/api/ops/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_OPS_ADMIN_SECRET]" \
  -d '{"actionId": "smoke.cms"}'
```
*Expected Output: `{"ok":true,"data":{"message":"CMS Smoke test passed. Services retrieved successfully.","count":X,...}}`*

---

🎉 **If both tests succeed, the PHD Backend Engine V1 is completely verified and operational in Production!**
