import { google } from 'googleapis';
import { env, decodeServiceAccountJson } from '../lib/env';

function getAuth() {
    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
        throw new Error('Google Service Account Base64 is missing from environment.');
    }
    const credentials = decodeServiceAccountJson(env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64);
    return new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
}

function getSheets() {
    return google.sheets({ version: 'v4', auth: getAuth() });
}

export async function getRows<T>(spreadsheetId: string, range: string): Promise<T[]> {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

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

export async function appendRow(spreadsheetId: string, range: string, payload: Record<string, any>) {
    const sheets = getSheets();

    // Fetch headers to guarantee column order correctness
    const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${range}!1:1`
    });

    const headers = headerResponse.data.values?.[0] as string[];
    if (!headers) throw new Error(`Could not find headers in sheet range: ${range}`);

    const rowData = headers.map(header => {
        const val = payload[header];
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        return val !== undefined && val !== null ? String(val) : '';
    });

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [rowData]
        }
    });
}

export async function updateRow(
    spreadsheetId: string,
    range: string,
    identifierColumn: string,
    identifierValue: string,
    updateColumn: string,
    targetValue: any
) {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    if (!rows || rows.length === 0) throw new Error('Sheet is empty');

    const headers = rows[0] as string[];
    const idColIndex = headers.indexOf(identifierColumn);
    const updColIndex = headers.indexOf(updateColumn);

    if (idColIndex === -1) throw new Error(`Identifier column '${identifierColumn}' not found`);
    if (updColIndex === -1) throw new Error(`Update column '${updateColumn}' not found`);

    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[idColIndex] === identifierValue);
    if (rowIndex === -1) throw new Error(`Row with ${identifierColumn} = ${identifierValue} not found`);

    const colLetter = String.fromCharCode(65 + updColIndex); // Works up to column Z
    const exactCellRange = `${range}!${colLetter}${rowIndex + 1}`;

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: exactCellRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[typeof targetValue === 'boolean' ? (targetValue ? 'TRUE' : 'FALSE') : targetValue]]
        }
    });
}

export async function setHeaders(spreadsheetId: string, range: string, headers: string[]) {
    const sheets = getSheets();
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${range}!A1`, // Starting at A1 will overwrite the first row horizontally
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [headers]
        }
    });
}
