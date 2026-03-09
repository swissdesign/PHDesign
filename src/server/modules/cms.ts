import { getRows } from '../adapters/googleSheets.ts';
import { env } from '../lib/env.ts';

export interface ServiceRow {
    id: string;
    isPublished: boolean | string;
    name_de: string;
    name_en: string;
    name_fr: string;
    name_it: string;
    category_slug: string;
    bullets_de: string;
    bullets_en: string;
    bullets_fr: string;
    bullets_it: string;
    start_price: string;
    image_id: string | null;
    folder_id: string | null;
}

export async function getServices(lang: string = 'de') {
    if (!env.GOOGLE_CMS_SHEET_ID) {
        throw new Error('GOOGLE_CMS_SHEET_ID is missing from environment.');
    }

    const rows = await getRows<ServiceRow>(env.GOOGLE_CMS_SHEET_ID, 'Services');
    const activeServices = rows.filter(row => row.isPublished === true || String(row.isPublished).toUpperCase() === 'TRUE');

    const isEn = lang === 'en';

    return activeServices.map((service, index) => {
        let bullets: string[] = [];
        try {
            const rawBullets = isEn ? service.bullets_en : service.bullets_de;
            if (rawBullets) {
                // Split on bullets, newlines, or pipes keeping it robust
                bullets = rawBullets.split(/[•|\n]+/).map(s => s.trim()).filter(Boolean);
            }
        } catch (e) {
            console.warn(`Failed to parse bullets for service ${service.id}`);
        }

        return {
            id: service.id || `service-${index}`,
            title: isEn ? service.name_en : service.name_de,
            category_slug: service.category_slug,
            price_chf: Number(service.start_price) || 0,
            bullets,
            start_price: service.start_price,
            image_id: service.image_id
        };
    });
}

// Ensure the payload matches identically to the legacy Google Apps Script output

export async function getProjects() {
    if (!env.GOOGLE_CMS_SHEET_ID) throw new Error('GOOGLE_CMS_SHEET_ID missing');
    const rows = await getRows<any>(env.GOOGLE_CMS_SHEET_ID, 'projects');
    return rows.filter(row => row.isPublished === true || row.isPublished === 'TRUE');
}

export async function getCategories() {
    if (!env.GOOGLE_CMS_SHEET_ID) throw new Error('GOOGLE_CMS_SHEET_ID missing');
    const rows = await getRows<any>(env.GOOGLE_CMS_SHEET_ID, 'categories');
    return rows.filter(row => row.isPublished === true || row.isPublished === 'TRUE');
}

export interface HeroExperimentRow {
    isPublished: boolean | string;
    sortOrder: string | number;
    theme: string;
    keyword: string;
    enemy: string;
    rallying_cry: string;
    question_de: string;
    question_en: string;
    doubt_de: string;
    doubt_en: string;
    experiment_title: string;
    experiment_slug: string;
    result_de: string;
    result_en: string;
    cta_label_de: string;
    cta_label_en: string;
    cta_href: string;
    accent: string;
}

export async function getHeroExperiments(): Promise<HeroExperimentRow[]> {
    if (!env.GOOGLE_CMS_SHEET_ID) throw new Error('GOOGLE_CMS_SHEET_ID missing');
    const rows = await getRows<HeroExperimentRow>(env.GOOGLE_CMS_SHEET_ID, 'hero_experiments');
    const activeRows = rows.filter(row => row.isPublished === true || row.isPublished === 'TRUE');

    return activeRows.sort((a, b) => {
        const sortA = Number(a.sortOrder) || 0;
        const sortB = Number(b.sortOrder) || 0;
        return sortA - sortB;
    });
}

