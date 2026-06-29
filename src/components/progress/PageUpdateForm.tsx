"use client";

import { useState } from "react";
import type { Book } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { playSound } from "@/lib/sounds";
import { fireConfetti } from "@/lib/celebrate";

interface PageUpdateFormProps {
  book: Book;
  onUpdate: (bookId: string, currentPage: number) => Promise<void>;
}

export function PageUpdateForm({ book, onUpdate }: PageUpdateFormProps) {
  const [page, setPage] = useState(book.currentPage.toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const num = parseInt(page, 10);
    if (isNaN(num) || num < 0 || num > book.totalPages) {
      setError(`Enter a page between 0 and ${book.totalPages}`);
      return;
    }

    setSaving(true);
    setError(null);
    const wasComplete = book.currentPage >= book.totalPages;
    const prevProgress = book.totalPages > 0 ? book.currentPage / book.totalPages : 0;

    try {
      await onUpdate(book.id, num);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update page");
      setSaving(false);
      return;
    }

    setSaving(false);

    const newProgress = book.totalPages > 0 ? num / book.totalPages : 0;

    if (!wasComplete && num >= book.totalPages) {
      fireConfetti("big");
      playSound("celebrate");
    } else if (newProgress >= 0.5 && prevProgress < 0.5) {
      playSound("levelUp");
      fireConfetti("small");
    } else if (newProgress >= 0.25 && prevProgress < 0.25) {
      playSound("success");
    } else {
      playSound("pageTurn");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`page-${book.id}`}>Current page</Label>
          <Input
            id={`page-${book.id}`}
            type="number"
            min={0}
            max={book.totalPages}
            value={page}
            onChange={(e) => {
              setPage(e.target.value);
              setError(null);
            }}
            className="w-28"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" sound="pageTurn" silent>
          {saving ? "Saving..." : "Update"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
