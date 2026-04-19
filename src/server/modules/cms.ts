import { getRows } from '../adapters/googleSheets.ts';
import { env } from '../lib/env.ts';

import type { Project, Service, Category } from '../../components/react/types';

export interface ServiceRow {
    id: string;
    isPublished: boolean | string;
    name_de?: string;
    name_en?: string;
    teaser_de?: string;
    teaser_en?: string;
    description_de?: string;
    description_en?: string;
    category_id?: string;
    category_slug?: string;
    bullets_de?: string;
    bullets_en?: string;
    start_price?: string;
    icon?: string;
}

export async function getServices(lang: string = 'de'): Promise<Service[]> {
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
                bullets = rawBullets.split(/[•|\n]+/).map(s => s.trim()).filter(Boolean);
            }
        } catch (e) {
            console.warn(`Failed to parse bullets for service ${service.id}`);
        }

        const name = isEn ? service.name_en : service.name_de;
        const description = isEn ? service.description_en : service.description_de;
        const teaser = isEn ? service.teaser_en : service.teaser_de;

        return {
            id: service.id || `service-${index}`,
            name: name || `Service ${index + 1}`,
            icon: service.icon || 'M12 2v20M2 12h20',
            teaser: teaser || description || '',
            description: description || '',
            categoryLabel: service.category_id || service.category_slug || '', // Will be mapped over later if needed, or by UI
            bullets,
            startPrice: service.start_price || ''
        };
    });
}

export interface ProjectRow {
    id?: string;
    slug?: string;
    isPublished: boolean | string;
    title_de?: string;
    title_en?: string;
    category?: string;
    date?: string;
    image?: string;
    description_de?: string;
    description_en?: string;
    clientUrl?: string;
    tags?: string | string[];
    gridSpan?: string;
}

export async function getProjects(lang: string = 'de'): Promise<Project[]> {
    if (!env.GOOGLE_CMS_SHEET_ID) throw new Error('GOOGLE_CMS_SHEET_ID missing');
    const rows = await getRows<ProjectRow>(env.GOOGLE_CMS_SHEET_ID, 'projects');
    const activeProjects = rows.filter(row => row.isPublished === true || String(row.isPublished).toUpperCase() === 'TRUE');

    const isEn = lang === 'en';

    return activeProjects.map((p, idx) => {
        const title = isEn ? p.title_en : p.title_de;
        const description = isEn ? p.description_en : p.description_de;
        
        let tags: string[] = [];
        if (typeof p.tags === 'string') {
            tags = p.tags.split(',').map(t => t.trim()).filter(Boolean);
        } else if (Array.isArray(p.tags)) {
            tags = p.tags;
        }

        return {
            id: p.id || p.slug || `proj-${idx}`,
            slug: p.slug,
            title: title || 'Untitled',
            category: p.category || '',
            date: p.date || '',
            image: p.image || '',
            description: description || '',
            clientUrl: p.clientUrl || '',
            tags,
            gridSpan: (p.gridSpan as any) || 'medium'
        };
    });
}

export interface CategoryRow {
    id?: string;
    slug?: string;
    name_de?: string;
    name_en?: string;
    isPublished: boolean | string;
    order?: number | string;
}

export async function getCategories(lang: string = 'de'): Promise<Category[]> {
    if (!env.GOOGLE_CMS_SHEET_ID) throw new Error('GOOGLE_CMS_SHEET_ID missing');
    const rows = await getRows<CategoryRow>(env.GOOGLE_CMS_SHEET_ID, 'categories');
    const active = rows.filter(row => row.isPublished === true || String(row.isPublished).toUpperCase() === 'TRUE');

    const isEn = lang === 'en';

    return active.map((c, idx) => {
        const name = isEn ? c.name_en : c.name_de;
        return {
            id: c.id || c.slug || `cat-${idx}`,
            slug: c.slug || '',
            name: name || '',
            order: Number(c.order) || 0
        };
    });
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

