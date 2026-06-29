"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import type { Book } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedProgress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface BookCardProps {
  book: Book;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  highlight?: boolean;
}

export function BookCard({
  book,
  selectable,
  selected,
  onSelect,
  onDelete,
  highlight,
}: BookCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;

  const card = (
    <Card
      className={`overflow-hidden transition-shadow ${
        selectable ? "cursor-pointer" : ""
      } ${selected ? "ring-2 ring-indigo-500 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30" : "hover:shadow-md"} ${
        highlight ? "ring-2 ring-emerald-400" : ""
      }`}
      onClick={selectable ? () => onSelect?.(book) : undefined}
    >
      {(highlight || selected) && (
        <motion.div
          layoutId={selected ? `selected-${book.id}` : undefined}
          className={`h-1 ${selected ? "bg-gradient-to-r from-indigo-500 to-violet-500" : "bg-gradient-to-r from-emerald-400 to-indigo-500"}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      )}
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-zinc-400">
                <BookOpen className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold leading-snug">{book.title}</h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
              {book.authors.join(", ") || "Unknown author"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{book.totalPages} pp</Badge>
              {(book.status ?? (book.currentPage > 0 ? "reading" : "want-to-read")) && (
                <Badge variant="outline">
                  {(book.status ?? (book.currentPage >= book.totalPages ? "finished" : book.currentPage > 0 ? "reading" : "want-to-read")).replace("-", " ")}
                </Badge>
              )}
              {book.currentPage > 0 && (
                <Badge variant="outline">{Math.round(progress)}% read</Badge>
              )}
              {selected && <Badge>In plan</Badge>}
            </div>
            {progress > 0 && <AnimatedProgress value={progress} className="mt-2 h-1.5" />}
          </div>
        </div>

        {!selectable && (
          <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/books/${book.id}`}>View</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/books/${book.id}/edit`} aria-label={`Edit ${book.title}`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => setConfirmDelete(true)}
                aria-label={`Delete ${book.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <motion.div
        layout
        whileHover={selectable ? { scale: 1.03, y: -2 } : { y: -2 }}
        whileTap={selectable ? { scale: 0.97 } : undefined}
        animate={
          selected
            ? { scale: 1.02, boxShadow: "0 8px 24px rgba(79,70,229,0.15)" }
            : { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }
        }
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        initial={highlight ? { opacity: 0, y: 12 } : false}
      >
        {card}
      </motion.div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{book.title}&rdquo;?</DialogTitle>
            <DialogDescription>
              This removes the book from your library. Books used in plans cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              sound="delete"
              onClick={() => {
                onDelete?.(book);
                setConfirmDelete(false);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
