import type { APIRoute } from 'astro';
import { getServices } from '../../server/modules/cms';

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const lang = url.searchParams.get('lang') || 'de';

        const services = await getServices(lang);

        return new Response(JSON.stringify({
            ok: true,
            services
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error: any) {
        console.error('CMS API Error:', error);
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
