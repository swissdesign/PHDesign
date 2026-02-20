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

type Inventory = { campaigns: CampaignRow[]; sites: SiteRow[] };
export type EnvSource = "import.meta.env" | "process.env" | null;

let cache: { value: Inventory; fetchedAt: number } | null = null;
const TTL_MS = 60_000;
const STALE_MS = 300_000;

function parseCsvList(v?: string): string[] {
  if (!v) return [];
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

function asStatus(v?: string): "active" | "paused" {
  return (v ?? "").trim().toLowerCase() === "paused" ? "paused" : "active";
}

function coerceWeight(v?: string): number {
  const n = Number((v ?? "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 1;
}

function clampStr(v: string, max: number) {
  const s = (v ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function isHttpsUrl(url: string): boolean {
  const u = (url ?? "").trim();
  return u.startsWith("https://");
}

function sheetRowsToObjects(values: string[][]): RawRow[] {
  if (!values || values.length < 2) return [];
  const headers = values[0].map(h => (h ?? "").trim());
  return values
    .slice(1)
    .filter(r => r.some(cell => String(cell ?? "").trim()))
    .map(r => {
      const obj: RawRow = {};
      headers.forEach((h, idx) => (obj[h] = String(r[idx] ?? "").trim()));
      return obj;
    });
}

function mapCampaign(r: RawRow): CampaignRow | null {
  const campaign_id = r["campaign_id"];
  if (!campaign_id) return null;

  const status = asStatus(r["status"]);
  const weight = coerceWeight(r["weight"]);

  const brand_name = clampStr(r["brand_name"] ?? "", 35);
  const headline = clampStr(r["headline"] ?? "", 45);
  const subline = clampStr(r["subline"] ?? "", 75);

  const site_url = (r["site_url"] ?? "").trim();
  const logo_url = (r["logo_url"] ?? "").trim();

  if (!brand_name || !headline || !subline) return null;
  if (!isHttpsUrl(site_url) || !isHttpsUrl(logo_url)) return null;

  const cta_label = clampStr(r["cta_label"] ?? "", 18) || undefined;
  const cta_url = (r["cta_url"] ?? "").trim() || undefined;
  const cta_type = (r["cta_type"] ?? "").trim() || undefined;

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

  return {
    site_id,
    status: asStatus(r["status"]),
    blocked_competitor_groups: parseCsvList(r["blocked_competitor_groups"]),
    groups: parseCsvList(r["groups"]),
  };
}

function isWithinDateWindow(now: Date, start?: string, end?: string): boolean {
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

  const eligible = campaigns.filter(c => {
    if (c.status !== "active") return false;
    if (!isWithinDateWindow(now, c.start_date, c.end_date)) return false;
    if (c.competitor_group && site.blocked_competitor_groups.includes(c.competitor_group)) return false;
    return true;
  });

  if (!eligible.length) return null;

  if (preferCampaignId) {
    const preferred = eligible.find(c => c.campaign_id === preferCampaignId);
    if (preferred) return preferred;
  }

  const total = eligible.reduce((sum, c) => sum + (c.weight || 1), 0);
  let r = Math.random() * total;
  for (const c of eligible) {
    r -= c.weight || 1;
    if (r <= 0) return c;
  }
  return eligible[eligible.length - 1];
}

function viteEnvByName(name: string): string | undefined {
  switch (name) {
    case "SPONSOR_SHEET_ID":
      return import.meta.env.SPONSOR_SHEET_ID;
    case "GOOGLE_SERVICE_ACCOUNT_JSON":
      return import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    case "SPONSOR_DOCK_DEBUG":
      return import.meta.env.SPONSOR_DOCK_DEBUG;
    default:
      return undefined;
  }
}

function resolveEnv(name: string): { value: string | null; source: EnvSource } {
  const viteEnv = viteEnvByName(name);
  const nodeEnv = process.env[name];
  const source: EnvSource = viteEnv != null ? "import.meta.env" : nodeEnv != null ? "process.env" : null;
  const value = (viteEnv ?? nodeEnv)?.toString() ?? null;
  return { value, source };
}

function getEnv(name: string): string {
  const viteEnv = viteEnvByName(name);
  const nodeEnv = process.env[name];
  const v = (viteEnv ?? nodeEnv)?.toString();

  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getSponsorDockEnvDebug(): {
  hasSheetId: boolean;
  hasSaJson: boolean;
  envSource: EnvSource;
} {
  const sheet = resolveEnv("SPONSOR_SHEET_ID");
  const sa = resolveEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  return {
    hasSheetId: Boolean(sheet.value),
    hasSaJson: Boolean(sa.value),
    envSource: sheet.source,
  };
}

async function fetchSheetTab(spreadsheetId: string, rangeA1: string) {
  const sa = JSON.parse(getEnv("GOOGLE_SERVICE_ACCOUNT_JSON"));

  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: rangeA1 });
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

    const campaigns = sheetRowsToObjects(adsValues ?? [])
      .map(mapCampaign)
      .filter((c): c is CampaignRow => Boolean(c));

    const sites = sheetRowsToObjects(sitesValues ?? [])
      .map(mapSite)
      .filter((s): s is SiteRow => Boolean(s));

    cache = { value: { campaigns, sites }, fetchedAt: now };
    return cache.value;
  } catch (err) {
    if (cache && now - cache.fetchedAt < STALE_MS) return cache.value;
    throw err;
  }
}
