import type { APIRoute } from 'astro';
import { createBooking } from '../../server/modules/booking';
import { checkRateLimit } from '../../server/lib/rateLimit';
import { log } from '../../server/lib/log';

export const POST: APIRoute = async ({ request }) => {
    try {
        // 1. Rate Limiting (In-Memory)
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (!checkRateLimit(ip)) {
            log.warn('booking', 'Rate limit exceeded for IP.', { ip });
            return new Response(JSON.stringify({ ok: false, error: 'Too Many Requests' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const payload = await request.json();

        // 2. Honeypot check (Silent Fail)
        if (payload._honey) {
            log.warn('booking', 'Honeypot triggered, simulating success.', { ip, name: payload.name });
            // Return fake success so bots don't adapt
            return new Response(JSON.stringify({ ok: true, fake_success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!payload.service_id || !payload.name || !payload.email) {
            return new Response(JSON.stringify({
                ok: false,
                error: 'Missing required fields: service_id, name, email'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        log.info('booking', 'Processing requested booking.', { email: payload.email, service_id: payload.service_id });
        const result = await createBooking(payload);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error: any) {
        log.error('booking', 'Failed to create booking.', error);
        return new Response(JSON.stringify({
            ok: false,
            error: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
