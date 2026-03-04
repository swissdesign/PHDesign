import type { APIRoute } from 'astro';

const contracts: Record<string, any> = {
    cms: {
        input: {
            type: 'object',
            properties: {
                lang: { type: 'string', default: 'de', enum: ['de', 'en'] }
            }
        },
        output: {
            type: 'object',
            properties: {
                ok: { type: 'boolean' },
                services: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            price_chf: { type: 'number' },
                            deposit_pct: { type: 'number' },
                            deliverables: { type: 'array', items: { type: 'string' } }
                        }
                    }
                }
            }
        }
    },
    booking: {
        input: {
            type: 'object',
            required: ['service_id', 'name', 'email'],
            properties: {
                service_id: { type: 'string' },
                lang: { type: 'string', default: 'de', enum: ['de', 'en'] },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                notes: { type: 'string' }
            }
        },
        output: {
            type: 'object',
            properties: {
                ok: { type: 'boolean' },
                booking_id: { type: 'string' },
                payment: {
                    type: 'object',
                    properties: {
                        provider: { type: 'string' },
                        amount_chf: { type: 'number' },
                        url: { type: 'string', format: 'uri' }
                    }
                }
            }
        }
    },
    payments: {
        webhook_input: {
            type: 'object',
            description: 'Follows standard Payrexx Webhook payload.'
        }
    }
};

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const targetModule = url.searchParams.get('module');

    if (targetModule) {
        if (!contracts[targetModule]) {
            return new Response(JSON.stringify({
                ok: false,
                error: { code: 'CONTRACT_NOT_FOUND', message: `No contract schema found for module: ${targetModule}` }
            }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({
            ok: true,
            module: targetModule,
            schema: contracts[targetModule]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // If no specific module, return catalog
    return new Response(JSON.stringify({
        ok: true,
        catalog: Object.keys(contracts).map(key => ({
            module: key,
            ref: `/api/meta-contracts?module=${key}`
        }))
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
