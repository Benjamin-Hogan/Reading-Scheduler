"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NormalizedBookSearchResult } from "@/lib/books/types";
import { fetchGoogleBookMetadata } from "@/lib/books/client";
import { useBooks } from "@/hooks/use-books";
import { BookSearch } from "@/components/books/BookSearch";
import { ManualBookForm } from "@/components/books/ManualBookForm";
import { BookCard } from "@/components/books/BookCard";
import { useToast } from "@/components/ui/toast";
import { FadeIn } from "@/components/layout/motion";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Library } from "lucide-react";

type AddState = "idle" | "adding" | "added" | "in-library";

export default function NewBookPage() {
  const router = useRouter();
  const { books, addBook } = useBooks();
  const { toast } = useToast();
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const libraryGoogleIds = useMemo(
    () => new Set(books.map((b) => b.googleVolumeId).filter(Boolean)),
    [books]
  );

  const lastAddedBook = lastAddedId ? books.find((b) => b.id === lastAddedId) : null;

  const getAddState = (result: NormalizedBookSearchResult): AddState => {
    if (addStates[result.googleVolumeId]) return addStates[result.googleVolumeId];
    if (libraryGoogleIds.has(result.googleVolumeId)) return "in-library";
    return "idle";
  };

  const handleGoogleAdd = async (result: NormalizedBookSearchResult, pageCount: number) => {
    const key = result.googleVolumeId;
    setAddStates((s) => ({ ...s, [key]: "adding" }));
    try {
      const meta = await fetchGoogleBookMetadata(result.googleVolumeId);
      const book = await addBook({
        title: result.title,
        subtitle: meta?.subtitle ?? result.subtitle,
        authors: result.authors,
        totalPages: pageCount,
        coverUrl: meta?.coverUrl ?? result.coverUrl,
        source: "google",
        googleVolumeId: result.googleVolumeId,
        isbn: meta?.isbn ?? result.isbn,
        description: meta?.description,
        publishedDate: meta?.publishedDate ?? result.publishedDate,
        publisher: meta?.publisher,
        language: meta?.language,
        categories: meta?.categories ?? result.categories,
        previewLink: meta?.previewLink,
      });
      setAddStates((s) => ({ ...s, [key]: "added" }));
      setLastAddedId(book.id);
      toast({
        variant: "success",
        title: "Book added!",
        description: `"${book.title}" is now in your library.`,
        celebrate: true,
      });
    } catch (e) {
      setAddStates((s) => ({ ...s, [key]: libraryGoogleIds.has(key) ? "in-library" : "idle" }));
      toast({
        variant: "error",
        title: "Could not add book",
        description: e instanceof Error ? e.message : "Something went wrong",
      });
    }
  };

  const handleManualAdd = async (data: Parameters<typeof addBook>[0]) => {
    const book = await addBook(data);
    setLastAddedId(book.id);
    toast({
      variant: "success",
      title: "Book added!",
      description: `"${book.title}" is now in your library.`,
      celebrate: true,
    });
    router.push(`/books/${book.id}`);
  };

  return (
    <FadeIn>
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Add a book</h1>
            <p className="text-zinc-500">Search Google Books or enter details manually</p>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/books">
              <Library className="h-4 w-4" />
              Library ({books.length})
            </Link>
          </Button>
        </div>

        <AnimatePresence>
          {lastAddedBook && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-emerald-600">Just added</p>
                <Link
                  href={`/books/${lastAddedBook.id}`}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  View details →
                </Link>
              </div>
              <BookCard book={lastAddedBook} highlight />
            </motion.div>
          )}
        </AnimatePresence>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Search Google Books</h2>
          <BookSearch onAdd={handleGoogleAdd} getAddState={getAddState} />
        </section>

        <Separator />

        <section>
          <h2 className="mb-4 text-lg font-semibold">Manual entry</h2>
          <ManualBookForm onSubmit={handleManualAdd} />
        </section>
      </div>
    </FadeIn>
  );
}
