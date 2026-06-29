"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Book, DailyAssignment } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PaceIndicatorProps {
  book: Book;
  assignments: DailyAssignment[];
}

export function PaceIndicator({ book, assignments }: PaceIndicatorProps) {
  const status = useMemo(() => {
    const today = formatDate(new Date());
    const bookAssignments = assignments
      .filter((a) => a.bookId === book.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (bookAssignments.length === 0) return null;

    const expected = bookAssignments.find((a) => a.date >= today) ??
      bookAssignments[bookAssignments.length - 1];

    const expectedPage = expected.date <= today ? expected.endPage : expected.startPage - 1;
    const diff = book.currentPage - expectedPage;

    if (Math.abs(diff) <= 5) return { variant: "success" as const, label: "On track" };
    if (diff > 0) return { variant: "success" as const, label: `${diff} pages ahead` };
    return { variant: "warning" as const, label: `${Math.abs(diff)} pages behind` };
  }, [book, assignments]);

  if (!status || book.currentPage === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      whileHover={{ scale: 1.05 }}
    >
      <Badge variant={status.variant}>{status.label}</Badge>
    </motion.div>
  );
}
