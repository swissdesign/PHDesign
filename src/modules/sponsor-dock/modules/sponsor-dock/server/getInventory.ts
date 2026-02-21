// src/modules/sponsor-dock/server/getInventory.ts
import { google } from "googleapis";

type RawRow = Record<string, string>;

export type SiteRow = {
  site_id: string;
  status: "active" | "paused";
  blocked_competitor_groups: string[];
  groups: string[];
};

export type CampaignRow = {
  campaign_id: string;
  status: "active" | "paused";
  weight: number;
  brand_name: string;
  headline: string;
  subline: string;
  site_url: string;
  logo_url: string;
  cta_label?: string;
  cta_url?: string;
  cta_type?: string;
  wa_url?: string;
  ig_url?: string;
  competitor_group?: string;
  target_groups?: string[];
  start_date?: string;
  end_date?: string;
};

type Inventory = {
  campaigns: CampaignRow[];
  sites: SiteRow[];
};

// ---------- Simple in-memory cache (v1) ----------
let cache: { value: Inventory; fetchedAt: number } | null = null;
const TTL_MS = 60_000; // 60s
const STALE_MS = 300_000; // 5min

function parseCsvList(v?: string): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toLowerSafe(v?: string) {
  return (v ?? "").trim().toLowerCase();
}

function asStatus(v: string): "active" | "paused" {
  return toLowerSafe(v) === "paused" ? "paused" : "active";
}

function clampStr(v: string, max: number) {
  const s = (v ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function isHttpsUrl(url: string): boolean {
  const u = (url ?? "").trim();
  if (!u) return false;
  // allow wa.me links as "https://wa.me/..."
  return u.startsWith("https://");
}

function coerceWeight(v: string): number {
  const n = Number((v ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.round(n);
}

function sheetRowsToObjects(values: string[][]): RawRow[] {
  if (!values || values.length < 2) return [];
  const headers = values[0].map((h) => (h ?? "").trim());
  const rows = values.slice(1);
  return rows
    .filter((r) => r.some((cell) => String(cell ?? "").trim().length > 0))
    .map((r) => {
      const obj: RawRow = {};
      headers.forEach((h, idx) => {
        obj[h] = String(r[idx] ?? "").trim();
      });
      return obj;
    });
}

function mapCampaign(r: RawRow): CampaignRow | null {
  const campaign_id = r["campaign_id"];
  if (!campaign_id) return null;

  const status = asStatus(r["status"]);
  const weight = coerceWeight(r["weight"]);
  const brand_name = clampStr(r["brand_name"], 35);
  const headline = clampStr(r["headline"], 45);
  const subline = clampStr(r["subline"], 75);
  const site_url = (r["site_url"] ?? "").trim();
  const logo_url = (r["logo_url"] ?? "").trim();

  if (!brand_name || !headline || !subline) return null;
  if (!isHttpsUrl(site_url) || !isHttpsUrl(logo_url)) return null;

  const cta_label = clampStr(r["cta_label"] ?? "", 18) || undefined;
  const cta_url = (r["cta_url"] ?? "").trim() || undefined;
  const cta_type = (r["cta_type"] ?? "").trim() || undefined;

  // If label exists, url must exist and be https.
  if (cta_label && (!cta_url || !isHttpsUrl(cta_url))) return null;

  const wa_url = (r["wa_url"] ?? "").trim() || undefined;
  if (wa_url && !isHttpsUrl(wa_url)) return null;

  const ig_url = (r["ig_url"] ?? "").trim() || undefined;
  if (ig_url && !isHttpsUrl(ig_url)) return null;

  const competitor_group = (r["competitor_group"] ?? "").trim() || undefined;
  const target_groups = parseCsvList(r["target_groups"]);

  const start_date = (r["start_date"] ?? "").trim() || undefined;
  const end_date = (r["end_date"] ?? "").trim() || undefined;

  return {
    campaign_id,
    status,
    weight,
    brand_name,
    headline,
    subline,
    site_url,
    logo_url,
    cta_label,
    cta_url,
    cta_type,
    wa_url,
    ig_url,
    competitor_group,
    target_groups: target_groups.length ? target_groups : undefined,
    start_date,
    end_date,
  };
}

function mapSite(r: RawRow): SiteRow | null {
  const site_id = r["site_id"];
  if (!site_id) return null;

  const status = asStatus(r["status"]);
  const blocked = parseCsvList(r["blocked_competitor_groups"]);
  const groups = parseCsvList(r["groups"]);

  return {
    site_id,
    status,
    blocked_competitor_groups: blocked,
    groups,
  };
}

function isWithinDateWindow(now: Date, start?: string, end?: string): boolean {
  // Expect YYYY-MM-DD; treat missing as open-ended
  const today = now.toISOString().slice(0, 10);
  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
}

export function selectCampaign(args: {
  campaigns: CampaignRow[];
  site: SiteRow;
  preferCampaignId?: string;
  now: Date;
}): CampaignRow | null {
  const { campaigns, site, preferCampaignId, now } = args;

  const eligible = campaigns.filter((c) => {
    if (c.status !== "active") return false;
    if (!isWithinDateWindow(now, c.start_date, c.end_date)) return false;
    if (
      c.competitor_group &&
      site.blocked_competitor_groups.includes(c.competitor_group)
    )
      return false;
    return true;
  });

  if (!eligible.length) return null;

  if (preferCampaignId) {
    const preferred = eligible.find((c) => c.campaign_id === preferCampaignId);
    if (preferred) return preferred;
  }

  // Weighted roulette
  const total = eligible.reduce((sum, c) => sum + (c.weight || 1), 0);
  let r = Math.random() * total;
  for (const c of eligible) {
    r -= c.weight || 1;
    if (r <= 0) return c;
  }
  return eligible[eligible.length - 1];
}

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function parseServiceAccountJson(): any {
  const raw = getEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  return JSON.parse(raw);
}

async function fetchSheetTab(spreadsheetId: string, rangeA1: string) {
  const sa = parseServiceAccountJson();
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: rangeA1,
  });
  return res.data.values as string[][] | undefined;
}

export async function getInventory(): Promise<Inventory> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) return cache.value;

  const spreadsheetId = getEnv("SPONSOR_SHEET_ID");

  try {
    const [adsValues, sitesValues] = await Promise.all([
      fetchSheetTab(spreadsheetId, "network_ads!A1:Z1000"),
      fetchSheetTab(spreadsheetId, "network_sites!A1:Z1000"),
    ]);

    const adsRows = sheetRowsToObjects(adsValues ?? []);
    const siteRows = sheetRowsToObjects(sitesValues ?? []);

    const campaigns = adsRows
      .map(mapCampaign)
      .filter((c): c is CampaignRow => Boolean(c));

    const sites = siteRows.map(mapSite).filter((s): s is SiteRow => Boolean(s));

    const value = { campaigns, sites };
    cache = { value, fetchedAt: now };
    return value;
  } catch (err) {
    // stale fallback
    if (cache && now - cache.fetchedAt < STALE_MS) return cache.value;
    throw err;
  }
}
