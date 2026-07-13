/** Normalize any string ke slug URL-safe: lowercase, dash-separated, no special chars. */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/[^a-z0-9]+/g, "-")                        // ganti non-alfanumerik jadi dash
    .replace(/^-+|-+$/g, "")                            // trim dash awal/akhir
    .replace(/-{2,}/g, "-");                            // collapse dash beruntun
}
