import { google } from 'googleapis';
import { env, decodeServiceAccountJson } from '../lib/env.ts';

export async function getRows<T>(spreadsheetId: string, range: string): Promise<T[]> {
    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
        throw new Error('Google Service Account Base64 is missing from environment.');
    }

    const credentials = decodeServiceAccountJson(env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64);

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
        return [];
    }

    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    return dataRows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            let val = row[index] !== undefined ? row[index] : null;
            if (val === 'TRUE') val = true;
            if (val === 'FALSE') val = false;
            obj[header] = val;
        });
        return obj as T;
    });
}
