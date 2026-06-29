import { describe, it, expect } from "vitest";
import type { ExportBundle } from "@/lib/db/schema";
import {
  emptyBundle,
  isEmptyBundle,
  mergeBundles,
  pruneTombstones,
} from "@/lib/sync/merge";

function book(id: string, updatedAt: string, currentPage = 0) {
  return {
    id,
    title: `Book ${id}`,
    authors: ["Author"],
    totalPages: 100,
    currentPage,
    source: "manual" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt,
  };
}

describe("mergeBundles", () => {
  it("keeps the record with the newer updatedAt", () => {
    const local: ExportBundle = {
      version: 1,
      exportedAt: "2026-06-29T00:00:00.000Z",
      books: [book("book-1", "2026-06-28T00:00:00.000Z", 10)],
      readingPlans: [],
      planBooks: [],
      dailyAssignments: [],
    };
    const remote: ExportBundle = {
      version: 1,
      exportedAt: "2026-06-29T00:00:00.000Z",
      books: [book("book-1", "2026-06-29T00:00:00.000Z", 25)],
      readingPlans: [],
      planBooks: [],
      dailyAssignments: [],
    };

    const { bundle } = mergeBundles(local, remote);
    expect(bundle.books).toHaveLength(1);
    expect(bundle.books[0]?.currentPage).toBe(25);
  });

  it("merges distinct records from both sides", () => {
    const local: ExportBundle = {
      ...emptyBundle(),
      books: [book("book-1", "2026-06-28T00:00:00.000Z")],
    };
    const remote: ExportBundle = {
      ...emptyBundle(),
      books: [book("book-2", "2026-06-28T00:00:00.000Z")],
    };

    const { bundle } = mergeBundles(local, remote);
    expect(bundle.books.map((b) => b.id).sort()).toEqual(["book-1", "book-2"]);
  });

  it("applies tombstones to remove deleted records", () => {
    const local: ExportBundle = {
      ...emptyBundle(),
      books: [book("book-1", "2026-06-29T00:00:00.000Z"), book("book-2", "2026-06-29T00:00:00.000Z")],
    };
    const remote: ExportBundle = {
      ...emptyBundle(),
      books: [book("book-1", "2026-06-29T00:00:00.000Z"), book("book-2", "2026-06-29T00:00:00.000Z")],
    };

    const { bundle } = mergeBundles(local, remote, [], [
      { recordId: "book-2", table: "books", deletedAt: "2026-06-29T12:00:00.000Z" },
    ]);

    expect(bundle.books.map((b) => b.id)).toEqual(["book-1"]);
  });

  it("prefers the newer tombstone when both sides delete", () => {
    const local: ExportBundle = {
      ...emptyBundle(),
      books: [book("book-1", "2026-06-29T00:00:00.000Z")],
    };
    const remote: ExportBundle = {
      ...emptyBundle(),
      books: [book("book-1", "2026-06-29T00:00:00.000Z")],
    };

    const { tombstones } = mergeBundles(
      local,
      remote,
      [{ recordId: "book-1", table: "books", deletedAt: "2026-06-29T10:00:00.000Z" }],
      [{ recordId: "book-1", table: "books", deletedAt: "2026-06-29T11:00:00.000Z" }]
    );

    expect(tombstones).toHaveLength(1);
    expect(tombstones[0]?.deletedAt).toBe("2026-06-29T11:00:00.000Z");
  });
});

describe("emptyBundle", () => {
  it("starts empty", () => {
    expect(isEmptyBundle(emptyBundle())).toBe(true);
  });
});

describe("pruneTombstones", () => {
  it("drops tombstones older than the retention window", () => {
    const now = Date.now();
    const recent = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();
    const stale = new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString();

    const pruned = pruneTombstones(
      [
        { recordId: "a", table: "books", deletedAt: recent },
        { recordId: "b", table: "books", deletedAt: stale },
      ],
      30
    );

    expect(pruned).toHaveLength(1);
    expect(pruned[0]?.recordId).toBe("a");
  });
});
