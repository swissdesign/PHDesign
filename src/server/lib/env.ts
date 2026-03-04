export function decodeServiceAccountJson(base64Str: string): any {
    if (!base64Str) {
        throw new Error('Missing service account base64 string.');
    }
    const decoded = Buffer.from(base64Str, 'base64').toString('utf-8');
    return JSON.parse(decoded);
}

export const env = {
    GOOGLE_CMS_SHEET_ID: import.meta.env?.GOOGLE_CMS_SHEET_ID ?? process.env.GOOGLE_CMS_SHEET_ID,
    GOOGLE_LEADS_SHEET_ID: import.meta.env?.GOOGLE_LEADS_SHEET_ID ?? process.env.GOOGLE_LEADS_SHEET_ID,
    GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: import.meta.env?.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 ?? process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
    PAYREXX_INSTANCE: import.meta.env?.PAYREXX_INSTANCE ?? process.env.PAYREXX_INSTANCE,
    PAYREXX_API_KEY: import.meta.env?.PAYREXX_API_KEY ?? process.env.PAYREXX_API_KEY,
    PAYREXX_WEBHOOK_SECRET: import.meta.env?.PAYREXX_WEBHOOK_SECRET ?? process.env.PAYREXX_WEBHOOK_SECRET,
};
