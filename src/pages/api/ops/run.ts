import type { APIRoute } from 'astro';
import { env } from '../../../server/lib/env';
import { getServices } from '../../../server/modules/cms';

export const POST: APIRoute = async ({ request }) => {
    try {
        // 1. Authenticate with Barer <OPS_ADMIN_SECRET>
        const authHeader = request.headers.get('Authorization');
        if (!env.OPS_ADMIN_SECRET) {
            return new Response(JSON.stringify({ ok: false, error: 'OPS_ADMIN_SECRET not configured on server.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        if (!authHeader || authHeader !== `Bearer ${env.OPS_ADMIN_SECRET}`) {
            return new Response(JSON.stringify({ ok: false, error: 'Unauthorized. Invalid or missing Bearer token.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. Parse Action ID
        const body = await request.json().catch(() => ({}));
        const actionId = body.actionId;

        if (!actionId) {
            return new Response(JSON.stringify({ ok: false, error: 'Missing actionId in payload.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 3. Strict Allowlist Router
        switch (actionId) {
            case 'smoke.cms': {
                const services = await getServices('de');
                return new Response(JSON.stringify({
                    ok: true,
                    data: {
                        message: 'CMS Smoke test passed. Services retrieved successfully.',
                        count: services.length,
                        sample: services[0]?.title || 'none'
                    }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            case 'health.env': {
                const hasValue = (val: any) => val !== undefined && val !== null && val !== '';
                const healthMap = {
                    GOOGLE_CMS_SHEET_ID: hasValue(env.GOOGLE_CMS_SHEET_ID),
                    GOOGLE_LEADS_SHEET_ID: hasValue(env.GOOGLE_LEADS_SHEET_ID),
                    GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: hasValue(env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64),
                    PAYREXX_INSTANCE: hasValue(env.PAYREXX_INSTANCE),
                    PAYREXX_API_KEY: hasValue(env.PAYREXX_API_KEY),
                    PAYREXX_WEBHOOK_SECRET: hasValue(env.PAYREXX_WEBHOOK_SECRET),
                    OPS_ADMIN_SECRET: hasValue(env.OPS_ADMIN_SECRET)
                };

                return new Response(JSON.stringify({
                    ok: true,
                    data: {
                        message: 'Environment health checked successfully.',
                        health: healthMap
                    }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            case 'test.payrexx': {
                // Just a dry-run stub as requested
                return new Response(JSON.stringify({
                    ok: true,
                    data: { message: 'Payrexx integration dry-run successful' }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            default: {
                return new Response(JSON.stringify({ ok: false, error: `actionId '${actionId}' is not allowed or not recognized.` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
        }

    } catch (error: any) {
        console.error('Ops Runner Error:', error);
        return new Response(JSON.stringify({ ok: false, error: error.message || 'Internal Ops Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
