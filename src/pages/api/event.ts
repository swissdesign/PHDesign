import type { APIRoute } from "astro";

type EventType =
  | "dock_viewed"
  | "dock_expanded"
  | "dock_collapsed"
  | "site_click"
  | "cta_click"
  | "social_click";

type SponsorEvent = {
  siteId: string;
  campaignId: string;
  eventType: EventType;
  ts?: string; // ISO
  href?: string; // click target (optional)
};

const DEDUPE_MS = 30_000; // 30s
const RATE_WINDOW_MS = 60_000; // 60s
const RATE_MAX = 120; // per IP per window (generous v1)

const dedupe = new Map<string, number>();
const rate = new Map<string, { windowStart: number; count: number }>();

function keyOf(e: SponsorEvent) {
  return `${e.siteId}::${e.campaignId}::${e.eventType}::${e.href ?? ""}`;
}

function getIp(request: Request) {
  // Vercel
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isValidEventType(v: string): v is EventType {
  return [
    "dock_viewed",
    "dock_expanded",
    "dock_collapsed",
    "site_click",
    "cta_click",
    "social_click",
  ].includes(v);
}

export const POST: APIRoute = async ({ request }) => {
  // Always respond quickly; do minimal work.
  // We still parse/validate to avoid junk spam.
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const e: SponsorEvent = {
    siteId: String(body?.siteId ?? "").trim(),
    campaignId: String(body?.campaignId ?? "").trim(),
    eventType: String(body?.eventType ?? "").trim() as EventType,
    ts: body?.ts ? String(body.ts) : undefined,
    href: body?.href ? String(body.href) : undefined,
  };

  if (!e.siteId || !e.campaignId || !e.eventType || !isValidEventType(e.eventType)) {
    return new Response(null, { status: 204 });
  }

  const ip = getIp(request);

  // Basic rate limit
  const now = Date.now();
  const r = rate.get(ip);
  if (!r || now - r.windowStart > RATE_WINDOW_MS) {
    rate.set(ip, { windowStart: now, count: 1 });
  } else {
    r.count += 1;
    if (r.count > RATE_MAX) return new Response(null, { status: 204 });
  }

  // Dedupe (prevents double beacons)
  const k = keyOf(e);
  const last = dedupe.get(k);
  if (last && now - last < DEDUPE_MS) {
    return new Response(null, { status: 204 });
  }
  dedupe.set(k, now);

  // Keep map small
  if (dedupe.size > 5000) {
    // cheap prune: delete oldest-ish by iterating
    for (const [kk, ts] of dedupe) {
      if (now - ts > DEDUPE_MS) dedupe.delete(kk);
      if (dedupe.size < 3000) break;
    }
  }

  // Log safely (no secrets)
  const serverTs = new Date().toISOString();
  console.log("[sponsor-event]", {
    serverTs,
    ip,
    siteId: e.siteId,
    campaignId: e.campaignId,
    eventType: e.eventType,
    href: e.href ?? null,
    clientTs: e.ts ?? null,
    ua: request.headers.get("user-agent") ?? null,
  });

  return new Response(null, { status: 204 });
};
