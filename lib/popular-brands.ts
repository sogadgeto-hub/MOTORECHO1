/**
 * Marques affichées en priorité dans le sélecteur véhicule.
 * Modifier cette liste pour ajuster la section « Marques populaires ».
 */
export const POPULAR_BRAND_NAMES: readonly string[] = [
  'Peugeot',
  'Renault',
  'Citroën',
  'Dacia',
  'Volkswagen',
  'Mercedes-Benz',
  'BMW',
  'Audi',
  'Toyota',
  'Ford',
  'Opel',
  'Fiat',
  'Nissan',
  'Hyundai',
  'Kia',
  'Volvo',
  'Seat',
  'Skoda',
  'Tesla',
  'Mini',
  'Land Rover',
];

function normalizeBrandKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Associe un nom populaire à une entrée de la base (tolère légères variantes). */
export function findBrandByPopularName<T extends { name: string }>(
  brands: T[],
  popularName: string
): T | undefined {
  const target = normalizeBrandKey(popularName);

  const exact = brands.find((b) => normalizeBrandKey(b.name) === target);
  if (exact) return exact;

  return brands.find((b) => {
    const key = normalizeBrandKey(b.name);
    return key.includes(target) || target.includes(key);
  });
}

/** Retourne les marques populaires présentes en base, dans l'ordre de POPULAR_BRAND_NAMES. */
export function pickPopularBrands<T extends { id: string; name: string }>(brands: T[]): T[] {
  const picked: T[] = [];
  const usedIds = new Set<string>();

  for (const name of POPULAR_BRAND_NAMES) {
    const match = findBrandByPopularName(brands, name);
    if (match && !usedIds.has(match.id)) {
      usedIds.add(match.id);
      picked.push(match);
    }
  }

  return picked;
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function brandMatchesQuery(brand: { name: string; country?: string | null }, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  const name = normalizeSearchText(brand.name);
  const country = normalizeSearchText(brand.country ?? '');
  return name.includes(q) || country.includes(q);
}
