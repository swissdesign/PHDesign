import type { APIRoute } from 'astro';
import { verifyWebhookSignature } from '../../../server/modules/payments';
import { appendRow, updateRow } from '../../../server/adapters/googleSheets';
import { env } from '../../../server/lib/env';

export const POST: APIRoute = async ({ request }) => {
    try {
        const rawBody = await request.text();
        const isVerified = verifyWebhookSignature(rawBody, ''); // Simplified verification for V1

        // Payrexx usually sends form encoded or JSON
        let payload: any;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            payload = Object.fromEntries(new URLSearchParams(rawBody));
        }

        // Payrexx transaction payload generally has transaction.status and transaction.referenceId
        const transaction = payload?.transaction || payload;
        const booking_id = transaction?.referenceId || '';
        const status = transaction?.status || 'UNKNOWN';

        if (!env.GOOGLE_LEADS_SHEET_ID) {
            throw new Error("Missing GOOGLE_LEADS_SHEET_ID");
        }

        const eventRecord = {
            created_at: new Date().toISOString(),
            booking_id: booking_id,
            provider: 'PAYREXX',
            event_type: status,
            raw_payload: rawBody,
            signature_valid: isVerified,
            processed: true
        };

        await appendRow(env.GOOGLE_LEADS_SHEET_ID, 'PaymentEvents', eventRecord);

        // If valid and confirmed deposit, update Bookings record
        if (isVerified && booking_id && status === 'confirmed') {
            await updateRow(env.GOOGLE_LEADS_SHEET_ID, 'Bookings', 'booking_id', booking_id, 'payment_status', 'PAID');
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Webhook API Error:', error);
        return new Response(JSON.stringify({
            ok: false,
            error: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
