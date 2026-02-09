const API = import.meta.env.PUBLIC_SHEETS_API_URL;

if (!API) {
  throw new Error("Missing PUBLIC_SHEETS_API_URL");
}

async function fetchJson(url: string) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Sheets API failed ${res.status}: ${url}`);
  return res.json();
}

export type SheetsAllResponse = {
  projects: any[];
  services: any[];
  categories: any[];
};

export async function getAll(_lang?: string): Promise<SheetsAllResponse> {
  return fetchJson(`${API}?resource=all`);
}

export async function getProjects(_lang?: string): Promise<any[]> {
  return fetchJson(`${API}?resource=projects`);
}

export async function getServices(_lang?: string): Promise<any[]> {
  return fetchJson(`${API}?resource=services`);
}

export async function getCategories(_lang?: string): Promise<any[]> {
  return fetchJson(`${API}?resource=categories`);
}
