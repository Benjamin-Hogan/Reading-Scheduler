"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Plus } from "lucide-react";
import type { NormalizedBookSearchResult } from "@/lib/books/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type AddState = "idle" | "adding" | "added" | "in-library";

interface SearchResultCardProps {
  result: NormalizedBookSearchResult;
  addState: AddState;
  onAdd: (result: NormalizedBookSearchResult, pageCount: number) => Promise<void>;
}

export function SearchResultCard({ result, addState, onAdd }: SearchResultCardProps) {
  const [pageCount, setPageCount] = useState(result.pageCount?.toString() ?? "");
  const needsPageCount = result.pageCountMissing || !result.pageCount;
  const isAdded = addState === "added" || addState === "in-library";

  const handleAdd = async () => {
    const pages = parseInt(pageCount, 10);
    if (!pages || pages < 1) return;
    await onAdd(result, pages);
  };

  return (
    <motion.div
      layout
      animate={
        addState === "added"
          ? { scale: [1, 1.02, 1], borderColor: ["#e4e4e7", "#34d399", "#34d399"] }
          : {}
      }
      transition={{ duration: 0.5 }}
      className={`flex gap-4 rounded-xl border p-4 transition-colors ${
        isAdded
          ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">
        {result.coverUrl ? (
          <Image src={result.coverUrl} alt={result.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">—</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-medium">{result.title}</h4>
        {result.subtitle && (
          <p className="text-sm text-zinc-500 line-clamp-1">{result.subtitle}</p>
        )}
        <p className="text-sm text-zinc-500">{result.authors.join(", ")}</p>
        {result.publishedDate && (
          <p className="text-xs text-zinc-400">Published {result.publishedDate}</p>
        )}
        {needsPageCount && !isAdded ? (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="warning">Page count needed</Badge>
            <Input
              type="number"
              min={1}
              placeholder="Pages"
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              className="h-8 w-24"
            />
          </div>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">{result.pageCount ?? pageCount} pages</p>
        )}
        <AnimatePresence mode="wait">
          {addState === "added" ? (
            <motion.div
              key="added"
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"
              >
                <Check className="h-3.5 w-3.5" />
              </motion.span>
              Added to your library!
            </motion.div>
          ) : addState === "in-library" ? (
            <Badge variant="success" className="mt-3">
              Already in library
            </Badge>
          ) : (
            <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                size="sm"
                className="mt-3 gap-1.5"
                sound="pop"
                onClick={handleAdd}
                disabled={addState === "adding"}
              >
                {addState === "adding" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Add to library
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
