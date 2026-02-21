# Sponsor Dock Network v1 (Astro + React Island + Vercel API + Google Sheets)

## Fixed decisions (v1)

- Collapsed height: 64px
- Expanded height: 240px
- Reveal delay: 2500ms
- Session TTL: 45 minutes
- Frequency cap: 24 hours (v1.1 optimization, not blocking v1)
- 1 sponsor per session (stable during session)
- Collapsed: logo + brand + headline + expand icon (no CTA button)
- Expanded: website link always + optional CTA button + SoMe row (SoMe expanded only)
- Competitor exclusion: enforced via site blocked competitor groups
- Global rotation now; group targeting later

## Data source

- Vercel API reads inventory from Google Sheets API using a service account (server-side).
- No redeploy required to change ads (Sheet changes go live within cache window).

## Google Sheet schema

### Tab: network_ads

Required columns:

- campaign_id
- status (active|paused)
- weight (number)
- brand_name (<=35)
- headline (<=45)
- subline (<=75)
- site_url (https)
- logo_url (https)

Optional:

- cta_label (<=18)
- cta_url (https)
- cta_type (book|reserve|call|whatsapp|custom)
- wa_url (https or wa.me)
- ig_url (https)
- competitor_group
- target_groups (comma list, unused v1)
- start_date (YYYY-MM-DD)
- end_date (YYYY-MM-DD)

### Tab: network_sites

- site_id
- status (active|paused)
- blocked_competitor_groups (comma list)
- groups (comma list, unused v1)

## API contracts

### GET /api/sponsor?siteId=...&path=...&preferCampaignId=...

- Returns 200 with one campaign or 204 if none.

200 JSON shape:
{
"version": 1,
"siteId": "...",
"selectedAt": "ISO",
"sessionTtlMinutes": 45,
"frequencyCapHours": 24,
"campaign": {
"campaignId": "...",
"brandName": "...",
"headline": "...",
"subline": "...",
"siteUrl": "...",
"logoUrl": "...",
"cta": { "label": "...", "url": "...", "type": "custom" } | null,
"social": { "whatsappUrl": null, "instagramUrl": null }
}
}

204: no body.

### POST /api/event

Request:
{
"version": 1,
"siteId": "...",
"campaignId": "...",
"eventType": "dock_expanded|site_click|cta_click|social_click",
"path": "/...",
"ts": "ISO",
"meta": { ... }
}
Response:
{ "ok": true }

## UI behavior

- Reserve space using CSS variable --dockSpace=64px + safe-area inset.
- If /api/sponsor returns 204, remove dock and set --dockSpace to 0px at runtime.
- Expand/collapse state machine:
  HIDDEN -> COLLAPSED -> EXPANDED -> COLLAPSED
- Click tracking uses sendBeacon / fetch keepalive before navigation.
