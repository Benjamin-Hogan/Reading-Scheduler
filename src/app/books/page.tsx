"use client";

import Link from "next/link";
import { Plus, Library } from "lucide-react";
import { useBooks } from "@/hooks/use-books";
import { useToast } from "@/components/ui/toast";
import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, StaggerList, StaggerItem, HoverLift, SlideUp } from "@/components/layout/motion";
import { EmptyState } from "@/components/layout/EmptyState";

export default function BooksPage() {
  const { books, isLoading, deleteBook } = useBooks();
  const { toast } = useToast();

  const handleDelete = async (book: { id: string; title: string }) => {
    try {
      await deleteBook(book.id);
      toast({
        variant: "success",
        title: "Book deleted",
        description: `"${book.title}" was removed.`,
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Something went wrong",
      });
    }
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <SlideUp>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">Library</h1>
                {!isLoading && (
                  <Badge variant="secondary" className="text-sm">
                    {books.length} book{books.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <p className="text-zinc-500">Add, edit, and manage books for your reading plans</p>
            </div>
            <Button asChild className="w-full gap-2 sm:w-auto" sound="pop">
              <Link href="/books/new">
                <Plus className="h-4 w-4" />
                Add book
              </Link>
            </Button>
          </div>
        </SlideUp>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <EmptyState
            icon={Library}
            title="Your library is empty"
            description="Search Google Books or add one manually to get started."
          >
            <Button asChild className="gap-2" sound="pop">
              <Link href="/books/new">
                <Plus className="h-4 w-4" />
                Add your first book
              </Link>
            </Button>
          </EmptyState>
        ) : (
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <StaggerItem key={book.id}>
                <HoverLift>
                  <BookCard book={book} onDelete={handleDelete} />
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>
    </FadeIn>
  );
}
