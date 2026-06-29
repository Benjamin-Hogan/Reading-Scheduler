import type { GoogleBooksVolume, NormalizedBookSearchResult } from "./types";
import { extractCoverUrl, extractIsbn } from "./metadata";

export function normalizeVolume(volume: GoogleBooksVolume): NormalizedBookSearchResult {
  const info = volume.volumeInfo;
  const coverUrl = extractCoverUrl(volume);
  const isbn = extractIsbn(volume);

  return {
    googleVolumeId: volume.id,
    title: info.title ?? "Unknown Title",
    subtitle: info.subtitle,
    authors: info.authors ?? [],
    pageCount: info.pageCount,
    coverUrl,
    isbn,
    pageCountMissing: !info.pageCount,
    publishedDate: info.publishedDate,
    categories: info.categories,
  };
}

export function normalizeSearchResults(volumes: GoogleBooksVolume[]): NormalizedBookSearchResult[] {
  const seen = new Set<string>();
  const results: NormalizedBookSearchResult[] = [];
  for (const volume of volumes) {
    if (seen.has(volume.id)) continue;
    seen.add(volume.id);
    results.push(normalizeVolume(volume));
  }
  return results;
}
