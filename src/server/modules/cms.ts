import { getRows } from '../adapters/googleSheets.ts';
import { env } from '../lib/env.ts';

export interface ServiceRow {
    id: string;
    active: boolean | string;
    sort: string | number;
    price_chf: string | number;
    deposit_pct: string | number;
    duration_label_de: string;
    duration_label_en: string;
    title_de: string;
    title_en: string;
    subtitle_de?: string;
    subtitle_en?: string;
    description_de: string;
    description_en: string;
    deliverables_de: string;
    deliverables_en: string;
    cta_de: string;
    cta_en: string;
    stripe_like_sku?: string;
    tags: string;
}

export async function getServices(lang: string = 'de') {
    if (!env.GOOGLE_CMS_SHEET_ID) {
        throw new Error('GOOGLE_CMS_SHEET_ID is missing from environment.');
    }

    const rows = await getRows<ServiceRow>(env.GOOGLE_CMS_SHEET_ID, 'Services');

    const activeServices = rows.filter(row => row.active === true || row.active === 'TRUE');

    const sortedServices = activeServices.sort((a, b) => {
        const sortA = Number(a.sort) || 0;
        const sortB = Number(b.sort) || 0;
        return sortA - sortB;
    });

    const isEn = lang === 'en';

    return sortedServices.map(service => {
        let deliverables: string[] = [];
        try {
            const rawDeliverables = isEn ? service.deliverables_en : service.deliverables_de;
            if (rawDeliverables) {
                if (rawDeliverables.startsWith('[')) {
                    deliverables = JSON.parse(rawDeliverables);
                } else {
                    deliverables = rawDeliverables.split('|').map(s => s.trim()).filter(Boolean);
                }
            }
        } catch (e) {
            console.warn(`Failed to parse deliverables for service ${service.id}`);
        }

        let tagsList: string[] = [];
        if (service.tags) {
            tagsList = service.tags.split(',').map(s => s.trim()).filter(Boolean);
        }

        return {
            id: service.id,
            title: isEn ? service.title_en : service.title_de,
            subtitle: isEn ? service.subtitle_en : service.subtitle_de,
            duration_label: isEn ? service.duration_label_en : service.duration_label_de,
            price_chf: Number(service.price_chf) || 0,
            deposit_pct: Number(service.deposit_pct) || 50,
            description: isEn ? service.description_en : service.description_de,
            deliverables,
            cta: isEn ? service.cta_en : service.cta_de,
            tags: tagsList
        };
    });
}
