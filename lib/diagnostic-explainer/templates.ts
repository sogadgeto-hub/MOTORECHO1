/** Remplace {{variable}} dans un modèle localisé. */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value !== undefined && value !== null ? String(value) : '';
  });
}

export function pickLocalizedBlock<T extends { lead: string; followUp: string }>(
  map: Record<string, T>,
  key: string,
  fallback: T
): T {
  return map[key] ?? fallback;
}

export function pickLocalizedString(
  map: Record<string, string>,
  key: string,
  fallback: string
): string {
  return map[key] ?? fallback;
}
