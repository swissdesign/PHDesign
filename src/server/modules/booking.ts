import { getServices } from './cms';
import { appendRow } from '../adapters/googleSheets';
import { env } from '../lib/env';
import { createCheckoutLink } from './payments';
import crypto from 'crypto';

interface BookingPayload {
    service_id: string;
    lang: string;
    name: string;
    email: string;
    phone?: string;
    preferred_start_date?: string;
    notes?: string;
}

export async function createBooking(payload: BookingPayload) {
    if (!env.GOOGLE_LEADS_SHEET_ID) {
        throw new Error('GOOGLE_LEADS_SHEET_ID missing');
    }

    // 1. Validate + load service from CMS
    const services = await getServices(payload.lang);
    const service = services.find(s => s.id === payload.service_id);

    if (!service) {
        throw new Error('Service not found or inactive');
    }

    // 2. Create booking_id
    const booking_id = `bk_${crypto.randomBytes(8).toString('hex')}`;

    // 3. Calculate deposit
    const price_chf = Number(service.price_chf) || 0;
    const deposit_pct = Number(service.deposit_pct) || 50;
    const deposit_amount_chf = Math.round(price_chf * (deposit_pct / 100));

    // 4. Write booking record
    const bookingRecord = {
        created_at: new Date().toISOString(),
        booking_id,
        service_id: payload.service_id,
        service_title_snapshot: service.title,
        lang: payload.lang,
        name: payload.name,
        email: payload.email,
        phone: payload.phone || '',
        preferred_start_date: payload.preferred_start_date || '',
        notes: payload.notes || '',
        price_chf_snapshot: price_chf,
        deposit_pct_snapshot: deposit_pct,
        deposit_amount_chf_snapshot: deposit_amount_chf,
        payment_provider: 'PAYREXX',
        payment_status: 'CREATED',
        payrexx_reference: '',
        status: 'NEW'
    };

    await appendRow(env.GOOGLE_LEADS_SHEET_ID, 'Bookings', bookingRecord);

    // 5. Create Payrexx Link
    const checkout = await createCheckoutLink(
        booking_id,
        deposit_amount_chf,
        `Deposit: ${service.title}`,
        payload.email
    );

    return {
        ok: true,
        booking_id,
        payment: {
            provider: 'payrexx',
            amount_chf: deposit_amount_chf,
            url: checkout.url
        }
    };
}
