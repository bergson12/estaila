/**
 * Slug helpers — URL-friendly identifiers.
 * Pure / safe to import client-side.
 */

const DIACRITICS_RE = /\p{Diacritic}/gu;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(DIACRITICS_RE, "") // strip accents
    .toLowerCase()
    .replace(/&/g, "-y-")
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric
    .trim()
    .replace(/[\s-]+/g, "-") // collapse spaces + dashes
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .slice(0, 80); // cap length
}

/**
 * Generate a property slug from title + location.
 * Example: "Casa en Miraflores" + "Santo Domingo" → "casa-en-miraflores-santo-domingo"
 */
export function propertySlug(title: string, location?: string | null): string {
  const base = location ? `${title} ${location}` : title;
  const s = slugify(base);
  return s || "propiedad";
}

/**
 * Append a numeric suffix if the slug already exists.
 * The caller passes a function that checks uniqueness in DB.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (s: string) => Promise<boolean>
): Promise<string> {
  let candidate = base;
  let n = 2;
  while (await isTaken(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 999) {
      // give up — append cuid suffix
      candidate = `${base}-${Math.random().toString(36).slice(2, 8)}`;
      break;
    }
  }
  return candidate;
}
