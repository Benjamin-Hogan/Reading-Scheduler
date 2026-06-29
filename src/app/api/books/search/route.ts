import { NextRequest, NextResponse } from "next/server";
import type { GoogleBooksResponse } from "@/lib/books/types";
import { normalizeSearchResults } from "@/lib/books/normalize";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "12");
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to search books. Check your API key configuration." },
        { status: res.status }
      );
    }

    const data = (await res.json()) as GoogleBooksResponse;
    const results = normalizeSearchResults(data.items ?? []);

    return NextResponse.json({ results, totalItems: data.totalItems ?? 0 });
  } catch {
    return NextResponse.json({ error: "Book search is temporarily unavailable" }, { status: 500 });
  }
}
