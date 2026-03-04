import type { APIRoute } from 'astro';
import { createBooking } from '../../server/modules/booking';

export const POST: APIRoute = async ({ request }) => {
    try {
        const payload = await request.json();

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

        const result = await createBooking(payload);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error: any) {
        console.error('Booking API Error:', error);
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
