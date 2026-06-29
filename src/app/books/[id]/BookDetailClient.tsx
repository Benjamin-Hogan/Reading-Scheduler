"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ExternalLink, Pencil, RefreshCw, Star, Trash2 } from "lucide-react";
import { useBook, useBooks } from "@/hooks/use-books";
import { useToast } from "@/components/ui/toast";
import { AnimatedProgressBar } from "@/components/progress/ProgressBar";
import { PageUpdateForm } from "@/components/progress/PageUpdateForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FadeIn } from "@/components/layout/motion";
import type { Book } from "@/lib/db/schema";
import { formatDisplayDate } from "@/lib/scheduler/dates";

function displayStatus(book: Book): string {
  const status =
    book.status ??
    (book.currentPage >= book.totalPages && book.totalPages > 0
      ? "finished"
      : book.currentPage > 0
        ? "reading"
        : "want-to-read");
  return status.replace(/-/g, " ");
}

function formatLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function BookDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const book = useBook(id);
  const { updateBook, deleteBook, getPlanCountForBook, refreshGoogleMetadata } = useBooks();
  const { toast } = useToast();
  const [planCount, setPlanCount] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) getPlanCountForBook(id).then(setPlanCount);
  }, [id, getPlanCountForBook]);

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

  const handleDelete = async () => {
    try {
      await deleteBook(book.id);
      toast({
        variant: "success",
        title: "Book deleted",
        description: `"${book.title}" was removed from your library.`,
      });
      router.push("/books");
    } catch (e) {
      toast({
        variant: "error",
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Something went wrong",
      });
    }
  };

  const handleRefreshMetadata = async () => {
    setRefreshing(true);
    try {
      await refreshGoogleMetadata(book.id);
      toast({
        variant: "success",
        title: "Metadata updated",
        description: "Refreshed details from Google Books.",
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Refresh failed",
        description: e instanceof Error ? e.message : "Something went wrong",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const hasDetails =
    book.description ||
    book.publishedDate ||
    book.publisher ||
    book.language ||
    (book.categories && book.categories.length > 0);

  const hasPersonal =
    book.notes ||
    (book.tags && book.tags.length > 0) ||
    book.personalRating ||
    book.startedAt ||
    book.finishedAt;

  return (
    <FadeIn>
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/books"
              className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Library
            </Link>
            <h1 className="text-2xl font-bold sm:text-3xl">{book.title}</h1>
            {book.subtitle && (
              <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400">{book.subtitle}</p>
            )}
            <p className="mt-1 text-zinc-500">{book.authors.join(", ") || "Unknown author"}</p>
          </div>
          <div className="flex shrink-0 gap-2 self-start">
            {book.googleVolumeId && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshMetadata}
                disabled={refreshing}
                aria-label="Refresh metadata from Google Books"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
            <Button variant="outline" size="icon" asChild aria-label={`Edit ${book.title}`}>
              <Link href={`/books/${book.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setConfirmDelete(true)}
              aria-label={`Delete ${book.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <div className="relative mx-auto h-56 w-40 shrink-0 overflow-hidden rounded-xl bg-zinc-100 shadow-md sm:mx-0 sm:h-48 sm:w-32 dark:bg-zinc-800">
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-zinc-400">
                <BookOpen className="h-10 w-10" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 content-start">
            <Badge variant="secondary">{book.totalPages} pages</Badge>
            <Badge variant="outline">{displayStatus(book)}</Badge>
            {book.format && <Badge variant="outline">{formatLabel(book.format)}</Badge>}
            {book.isbn && <Badge variant="outline">ISBN {book.isbn}</Badge>}
            {book.personalRating && (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {book.personalRating}/5
              </Badge>
            )}
            {planCount > 0 && (
              <Badge>In {planCount} plan{planCount !== 1 ? "s" : ""}</Badge>
            )}
            {book.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {hasDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About this book</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {book.description && (
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                  {book.description}
                </p>
              )}
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                {book.publishedDate && (
                  <div>
                    <dt className="text-zinc-500">Published</dt>
                    <dd>{book.publishedDate}</dd>
                  </div>
                )}
                {book.publisher && (
                  <div>
                    <dt className="text-zinc-500">Publisher</dt>
                    <dd>{book.publisher}</dd>
                  </div>
                )}
                {book.language && (
                  <div>
                    <dt className="text-zinc-500">Language</dt>
                    <dd>{book.language}</dd>
                  </div>
                )}
                {book.categories && book.categories.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-zinc-500">Categories</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {book.categories.map((c) => (
                        <Badge key={c} variant="outline">
                          {c}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              {book.previewLink && (
                <a
                  href={book.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                >
                  Preview on Google Books
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {hasPersonal && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {book.notes && (
                <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">{book.notes}</p>
              )}
              <dl className="grid gap-2 sm:grid-cols-2">
                {book.startedAt && (
                  <div>
                    <dt className="text-zinc-500">Started</dt>
                    <dd>{formatDisplayDate(book.startedAt)}</dd>
                  </div>
                )}
                {book.finishedAt && (
                  <div>
                    <dt className="text-zinc-500">Finished</dt>
                    <dd>{formatDisplayDate(book.finishedAt)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reading progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatedProgressBar current={book.currentPage} total={book.totalPages} />
            <PageUpdateForm
              book={book}
              onUpdate={async (bookId, page) => {
                const updates: Partial<Book> = {
                  currentPage: page,
                  status: page >= book.totalPages ? "finished" : page > 0 ? "reading" : "want-to-read",
                };
                if (page > 0 && !book.startedAt) {
                  updates.startedAt = new Date().toISOString().split("T")[0];
                }
                if (page >= book.totalPages && !book.finishedAt) {
                  updates.finishedAt = new Date().toISOString().split("T")[0];
                }
                await updateBook(bookId, updates);
                toast({
                  variant: "success",
                  title: "Progress saved",
                  description: `You're on page ${page} of ${book.totalPages}.`,
                });
              }}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/plans/new">Use in a reading plan</Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href={`/books/${book.id}/edit`}>Edit book</Link>
          </Button>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this book?</DialogTitle>
            <DialogDescription>
              &ldquo;{book.title}&rdquo; will be removed from your library.
              {planCount > 0 &&
                ` It's used in ${planCount} reading plan${planCount !== 1 ? "s" : ""}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </FadeIn>
  );
}
