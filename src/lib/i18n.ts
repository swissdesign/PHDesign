export const LANGS = ['de', 'en', 'fr', 'it'] as const;
export type Lang = (typeof LANGS)[number];

export function normalizeLang(input: unknown): Lang {
  const v = String(input ?? '').toLowerCase();
  return (LANGS as readonly string[]).includes(v) ? (v as Lang) : 'de';
}
