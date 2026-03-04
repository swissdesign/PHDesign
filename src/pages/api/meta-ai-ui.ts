import type { APIRoute } from 'astro';
import { env } from '../../server/lib/env';

export const GET: APIRoute = async () => {

    const hasValue = (val: any) => val !== undefined && val !== null && val !== '';

    const uiSpec = {
        ok: true,
        ui: {
            panels: [
                {
                    id: 'health',
                    title: 'System Health',
                    items: [
                        {
                            key: 'GOOGLE_CMS_SHEET_ID',
                            label: 'CMS Google Sheet',
                            state: hasValue(env.GOOGLE_CMS_SHEET_ID) ? 'set' : 'missing'
                        },
                        {
                            key: 'GOOGLE_LEADS_SHEET_ID',
                            label: 'Leads Google Sheet',
                            state: hasValue(env.GOOGLE_LEADS_SHEET_ID) ? 'set' : 'missing'
                        },
                        {
                            key: 'GOOGLE_SERVICE_ACCOUNT_JSON_BASE64',
                            label: 'Service Account Auth',
                            state: hasValue(env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) ? 'set' : 'missing'
                        },
                        {
                            key: 'PAYREXX_API_KEY',
                            label: 'Payrexx Connect',
                            state: hasValue(env.PAYREXX_API_KEY) ? 'set' : 'missing'
                        }
                    ]
                },
                {
                    id: 'features',
                    title: 'Feature Toggles',
                    items: [
                        { key: 'cms', label: 'CMS Engine', enabled: true },
                        { key: 'booking', label: 'Service Booking', enabled: true },
                        { key: 'payments', label: 'Payrexx Payments', enabled: true },
                        { key: 'contact', label: 'Contact Flow', enabled: false }, // Stub
                        { key: 'ai_draft', label: 'AI Email Draft', enabled: false } // Future
                    ]
                },
                {
                    id: 'operations',
                    title: 'Operations & Tests',
                    items: [
                        { action: 'smoke.cms', label: 'Run CMS Smoke Test', endpoint: '/api/_ops/run?action=smoke.cms' },
                        { action: 'dryrun.booking', label: 'Test Booking Dry-Run', endpoint: '/api/_ops/run?action=dryrun.booking' },
                        { action: 'test.payrexx_link', label: 'Generate Test Payment Link', endpoint: '/api/_ops/run?action=test.payrexx_link' }
                    ]
                }
            ]
        }
    };

    return new Response(JSON.stringify(uiSpec), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
