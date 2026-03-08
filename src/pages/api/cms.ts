import type { APIRoute } from 'astro';
import { getServices, getProjects, getCategories, getHeroExperiments } from '../../server/modules/cms';

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const lang = url.searchParams.get('lang') || 'de';
        let payload: any = {};
        const resource = url.searchParams.get('resource') || 'services';

        if (resource === 'services' || resource === 'all') {
            payload.services = await getServices(lang);
        }
        if (resource === 'projects' || resource === 'all') {
            payload.projects = await getProjects();
        }
        if (resource === 'categories' || resource === 'all') {
            payload.categories = await getCategories();
        }
        if (resource === 'hero_experiments' || resource === 'all') {
            payload.heroExperiments = await getHeroExperiments();
        }

        return new Response(JSON.stringify({
            ok: true,
            ...(resource === 'all' ? payload : { [resource]: payload[resource] })
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
