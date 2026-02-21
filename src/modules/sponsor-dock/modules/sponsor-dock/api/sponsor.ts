// src/api/sponsor.ts
import type { APIRoute } from "astro";
import {
  getInventory,
  selectCampaign,
} from "../modules/sponsor-dock/server/getInventory";

export const GET: APIRoute = async ({ url }) => {
  const siteId = url.searchParams.get("siteId")?.trim();
  const path = url.searchParams.get("path")?.trim() ?? null;
  const preferCampaignId =
    url.searchParams.get("preferCampaignId")?.trim() ?? undefined;

  if (!siteId) {
    return new Response("Missing siteId", { status: 400 });
  }

  const now = new Date();

  try {
    const inv = await getInventory();
    const site = inv.sites.find((s) => s.site_id === siteId);

    if (!site || site.status !== "active") {
      return new Response(null, { status: 204 });
    }

    const campaign = selectCampaign({
      campaigns: inv.campaigns,
      site,
      preferCampaignId,
      now,
    });

    if (!campaign) {
      return new Response(null, { status: 204 });
    }

    const body = {
      version: 1,
      siteId,
      selectedAt: now.toISOString(),
      sessionTtlMinutes: 45,
      frequencyCapHours: 24,
      campaign: {
        campaignId: campaign.campaign_id,
        brandName: campaign.brand_name,
        headline: campaign.headline,
        subline: campaign.subline,
        siteUrl: campaign.site_url,
        logoUrl: campaign.logo_url,
        cta: campaign.cta_label
          ? {
              label: campaign.cta_label,
              url: campaign.cta_url!,
              type: campaign.cta_type ?? "custom",
            }
          : null,
        social: {
          whatsappUrl: campaign.wa_url ?? null,
          instagramUrl: campaign.ig_url ?? null,
        },
        // Keep these server-side only for now:
        // competitorGroup: campaign.competitor_group ?? null,
        // targetGroups: campaign.target_groups ?? null,
      },
      debug: process.env.NODE_ENV === "development" ? { path } : undefined,
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "sponsor_fetch_failed",
        message: e?.message ?? "unknown",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }
};
