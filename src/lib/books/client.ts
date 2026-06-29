import type { GoogleBookMetadata } from "./types";

export async function fetchGoogleBookMetadata(
  googleVolumeId: string
): Promise<GoogleBookMetadata | null> {
  const res = await fetch(`/api/books/volume/${encodeURIComponent(googleVolumeId)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { metadata: GoogleBookMetadata };
  return data.metadata;
}
