import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      hasSheetId: Boolean(process.env.SPONSOR_SHEET_ID),
      hasServiceAccountJson: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
