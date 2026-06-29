"use client";

import { useCallback, useEffect, useState } from "react";
import type { NormalizedBookSearchResult } from "@/lib/books/types";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchResultCard } from "./SearchResultCard";

type AddState = "idle" | "adding" | "added" | "in-library";

interface BookSearchProps {
  onAdd: (result: NormalizedBookSearchResult, pageCount: number) => Promise<void>;
  getAddState: (result: NormalizedBookSearchResult) => AddState;
}

export function BookSearch({ onAdd, getAddState }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedBookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        setResults([]);
      } else {
        setResults(data.results);
      }
    } catch {
      setError("Search is temporarily unavailable");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by title, author, or ISBN..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-11"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <SearchResultCard
              key={r.googleVolumeId}
              result={r}
              addState={getAddState(r)}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && !error && (
        <p className="py-8 text-center text-sm text-zinc-500">No books found — try manual entry below</p>
      )}
    </div>
  );
}
