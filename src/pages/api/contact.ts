import type { APIRoute } from 'astro';
import { checkRateLimit } from '../../server/lib/rateLimit';
import { log } from '../../server/lib/log';
import { appendRow } from '../../server/adapters/googleSheets';
import { env } from '../../server/lib/env';

export const POST: APIRoute = async ({ request }) => {
    try {
        // 1. Hardcore Rate Limiting (In-Memory)
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (!checkRateLimit(ip)) {
            log.warn('contact', 'Rate limit exceeded for IP.', { ip });
            return new Response(JSON.stringify({ ok: false, error: 'Too Many Requests' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const payload = await request.json();

        // 2. Honeypot check (Silent Fail)
        if (payload._honey) {
            log.warn('contact', 'Honeypot triggered, simulating success.', { ip, email: payload.email });
            // Return fake success so bots don't adapt
            return new Response(JSON.stringify({ ok: true, fake_success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!payload.email || !payload.notes) {
            return new Response(JSON.stringify({
                ok: false,
                error: 'Missing required fields: email, notes'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        log.info('contact', 'Processing requested contact.', { email: payload.email, service_id: payload.service_id });

        // Push contact payload to Leads spreadsheet
        if (!env.GOOGLE_LEADS_SHEET_ID) {
            log.warn('contact', 'GOOGLE_LEADS_SHEET_ID missing, cannot append row', { email: payload.email });
        } else {
            await appendRow(env.GOOGLE_LEADS_SHEET_ID, 'Leads', {
                created_at: new Date().toISOString(),
                source: 'Contact Form',
                service_id: payload.service_id || 'general',
                name: payload.name || payload.email,
                email: payload.email,
                notes: payload.notes,
                status: 'NEW'
            });
        }

        return new Response(JSON.stringify({ ok: true, message: 'Message recorded' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        log.error('contact', 'Failed to process contact submission.', error);
        return new Response(JSON.stringify({
            ok: false,
            error: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
