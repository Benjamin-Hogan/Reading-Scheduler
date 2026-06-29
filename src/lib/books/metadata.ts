import type { GoogleBooksVolume, GoogleBookMetadata } from "./types";

export function extractIsbn(volume: GoogleBooksVolume): string | undefined {
  const info = volume.volumeInfo;
  return (
    info.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ??
    info.industryIdentifiers?.find((i) => i.type === "ISBN_10")?.identifier
  );
}

export function extractCoverUrl(volume: GoogleBooksVolume): string | undefined {
  return volume.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:");
}

export function extractGoogleMetadata(volume: GoogleBooksVolume): GoogleBookMetadata {
  const info = volume.volumeInfo;
  return {
    subtitle: info.subtitle,
    description: info.description,
    publishedDate: info.publishedDate,
    publisher: info.publisher,
    language: info.language,
    categories: info.categories,
    previewLink: info.previewLink,
    isbn: extractIsbn(volume),
    coverUrl: extractCoverUrl(volume),
    pageCount: info.pageCount,
  };
}
