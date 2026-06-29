import { NextRequest, NextResponse } from "next/server";
import type { GoogleBooksVolume } from "@/lib/books/types";
import { extractGoogleMetadata } from "@/lib/books/metadata";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Volume id is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}`);
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });

    if (res.status === 404) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch book details" },
        { status: res.status }
      );
    }

    const volume = (await res.json()) as GoogleBooksVolume;
    const info = volume.volumeInfo;

    return NextResponse.json({
      googleVolumeId: volume.id,
      title: info.title ?? "Unknown Title",
      authors: info.authors ?? [],
      metadata: extractGoogleMetadata(volume),
    });
  } catch {
    return NextResponse.json({ error: "Book details are temporarily unavailable" }, { status: 500 });
  }
}
