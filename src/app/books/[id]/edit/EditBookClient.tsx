"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useBook, useBooks } from "@/hooks/use-books";
import { ManualBookForm } from "@/components/books/ManualBookForm";
import { useToast } from "@/components/ui/toast";
import { FadeIn } from "@/components/layout/motion";
import { Button } from "@/components/ui/button";

export default function EditBookClient({ id }: { id: string }) {
  const router = useRouter();
  const book = useBook(id);
  const { updateBook } = useBooks();
  const { toast } = useToast();

  if (book === undefined) {
    return <p className="text-zinc-500">Loading...</p>;
  }

  if (!book) {
    return (
      <div className="space-y-4 text-center py-16">
        <p className="text-zinc-500">Book not found</p>
        <Button asChild variant="outline">
          <Link href="/books">Back to library</Link>
        </Button>
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href={`/books/${book.id}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to book
          </Link>
          <h1 className="text-3xl font-bold">Edit book</h1>
          <p className="text-zinc-500">Update details, notes, and metadata</p>
        </div>
        <ManualBookForm
          submitLabel="Save changes"
          initial={{
            title: book.title,
            subtitle: book.subtitle,
            authors: book.authors,
            totalPages: book.totalPages,
            coverUrl: book.coverUrl,
            source: book.source,
            googleVolumeId: book.googleVolumeId,
            isbn: book.isbn,
            description: book.description,
            publishedDate: book.publishedDate,
            publisher: book.publisher,
            language: book.language,
            categories: book.categories,
            format: book.format,
            status: book.status,
            notes: book.notes,
            tags: book.tags,
            personalRating: book.personalRating,
            startedAt: book.startedAt,
            finishedAt: book.finishedAt,
            previewLink: book.previewLink,
          }}
          onSubmit={async (data) => {
            await updateBook(book.id, {
              title: data.title,
              subtitle: data.subtitle,
              authors: data.authors,
              totalPages: data.totalPages,
              coverUrl: data.coverUrl,
              isbn: data.isbn,
              description: data.description,
              publishedDate: data.publishedDate,
              publisher: data.publisher,
              language: data.language,
              categories: data.categories,
              format: data.format,
              status: data.status,
              notes: data.notes,
              tags: data.tags,
              personalRating: data.personalRating,
              startedAt: data.startedAt,
              finishedAt: data.finishedAt,
            });
            toast({
              variant: "success",
              title: "Book updated",
              description: `Changes to "${data.title}" were saved.`,
            });
            router.push(`/books/${book.id}`);
          }}
        />
      </div>
    </FadeIn>
  );
}
