import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    return new Response(JSON.stringify({
        ok: true,
        version: '1.0.0',
        modules: {
            cms: {
                enabled: true,
                version: 'v1.0.0-rc',
                requiredEnvKeys: ['GOOGLE_CMS_SHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_JSON_BASE64'],
                schemas: '/api/meta-contracts?module=cms',
            },
            contact: {
                enabled: false, // Stubbed for later
                version: 'v1.0.0-rc',
                requiredEnvKeys: ['GOOGLE_LEADS_SHEET_ID'],
                schemas: '/api/meta-contracts?module=contact',
            },
            booking: {
                enabled: true,
                version: 'v1.0.0-rc',
                requiredEnvKeys: ['GOOGLE_LEADS_SHEET_ID', 'GOOGLE_CMS_SHEET_ID'],
                schemas: '/api/meta-contracts?module=booking',
            },
            payments: {
                enabled: true,
                version: 'v1.0.0-rc',
                requiredEnvKeys: ['PAYREXX_INSTANCE', 'PAYREXX_API_KEY', 'PAYREXX_WEBHOOK_SECRET'],
                schemas: '/api/meta-contracts?module=payments',
            }
        }
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
