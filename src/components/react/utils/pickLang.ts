import type { Lang } from '../../../lib/i18n';

const asRow = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  return {};
};

export function pickLang(row: unknown, baseKey: string, lang: Lang): string {
  const data = asRow(row);
  const first = data[`${baseKey}_${lang}`];
  if (typeof first === 'string' && first.trim()) return first.trim();

  const fallbackDe = data[`${baseKey}_de`];
  if (typeof fallbackDe === 'string' && fallbackDe.trim()) return fallbackDe.trim();

  const fallback = data[baseKey];
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim();

  return '';
}

export function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function pickLangArray(row: unknown, baseKey: string, lang: Lang): string[] {
  const data = asRow(row);
  const local = toTextArray(data[`${baseKey}_${lang}`]);
  if (local.length > 0) return local;

  const de = toTextArray(data[`${baseKey}_de`]);
  if (de.length > 0) return de;

  return toTextArray(data[baseKey]);
}
