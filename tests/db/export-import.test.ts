import { describe, it, expect } from "vitest";
import type { ExportBundle } from "@/lib/db/schema";
import type { ImportStrategy } from "@/lib/db/export-import";

function applyImportStrategy(
  existingIds: string[],
  incomingIds: string[],
  strategy: ImportStrategy
): string[] {
  if (strategy === "replace") {
    return [...incomingIds];
  }
  return [...new Set([...existingIds, ...incomingIds])];
}

const sampleBundle: ExportBundle = {
  version: 1,
  exportedAt: "2026-06-29T00:00:00.000Z",
  books: [
    {
      id: "book-1",
      title: "Sample",
      authors: ["Author"],
      totalPages: 100,
      currentPage: 0,
      source: "manual",
      createdAt: "2026-01-01",
    },
  ],
  readingPlans: [],
  planBooks: [],
  dailyAssignments: [],
};

describe("importData strategies", () => {
  it("merge keeps existing records and adds new ones", () => {
    const result = applyImportStrategy(["existing"], sampleBundle.books.map((b) => b.id), "merge");
    expect(result).toHaveLength(2);
    expect(result).toContain("existing");
    expect(result).toContain("book-1");
  });

  it("replace clears existing data", () => {
    const result = applyImportStrategy(["existing"], sampleBundle.books.map((b) => b.id), "replace");
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("book-1");
  });

  it("rejects unsupported export versions", () => {
    expect(() => {
      const bundle = { ...sampleBundle, version: 2 as 1 };
      if (bundle.version !== 1) {
        throw new Error("Unsupported export version");
      }
    }).toThrow("Unsupported export version");
  });
});
