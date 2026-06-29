"use client";

import { motion, Reorder } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import type { Book } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { playSound } from "@/lib/sounds";

interface BookQueueProps {
  books: Book[];
  onReorder: (books: Book[]) => void;
  onRemove: (bookId: string) => void;
  draggable?: boolean;
}

export function BookQueue({ books, onReorder, onRemove, draggable = true }: BookQueueProps) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= books.length) return;
    playSound("swoosh");
    const next = [...books];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onReorder(next);
  };

  if (books.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500"
      >
        No books selected yet
      </motion.p>
    );
  }

  if (draggable) {
    return (
      <Reorder.Group axis="y" values={books} onReorder={onReorder} className="space-y-2">
        {books.map((book, index) => (
          <Reorder.Item
            key={book.id}
            value={book}
            onDragStart={() => playSound("tick")}
            onDragEnd={() => playSound("pop")}
            className="flex cursor-grab items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-950"
            whileDrag={{ scale: 1.03, boxShadow: "0 8px 24px rgba(79,70,229,0.2)" }}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-zinc-400" />
            <motion.span
              layout
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700"
            >
              {index + 1}
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{book.title}</p>
              <p className="text-xs text-zinc-500">
                {book.totalPages - book.currentPage} pages remaining
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              sound="delete"
              onClick={() => onRemove(book.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    );
  }

  return (
    <div className="space-y-2">
      {books.map((book, index) => (
        <motion.div
          key={book.id}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{book.title}</p>
            <p className="text-xs text-zinc-500">
              {book.totalPages - book.currentPage} pages remaining
            </p>
          </div>
          {index < books.length - 1 && (
            <Button type="button" variant="ghost" size="sm" sound="swoosh" onClick={() => move(index, index + 1)}>
              ↓
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon" sound="delete" onClick={() => onRemove(book.id)}>
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
