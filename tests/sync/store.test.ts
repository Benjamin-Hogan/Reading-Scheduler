import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { emptyBundle } from "@/lib/sync/merge";

describe("sync store", () => {
  let syncDir = "";

  beforeEach(async () => {
    syncDir = await mkdtemp(path.join(tmpdir(), "reading-sync-"));
    process.env.SYNC_DATA_DIR = syncDir;
    const { __syncStore } = globalThis as typeof globalThis & {
      __syncStore?: Map<string, unknown>;
    };
    __syncStore?.clear();
  });

  afterEach(async () => {
    delete process.env.SYNC_DATA_DIR;
    const { __syncStore } = globalThis as typeof globalThis & {
      __syncStore?: Map<string, unknown>;
    };
    __syncStore?.clear();
    await rm(syncDir, { recursive: true, force: true });
  });

  it("persists, merges, and reloads user snapshots", async () => {
    const { pullSyncSnapshot, pushSyncSnapshot, getSyncSnapshot } = await import(
      "@/lib/sync/store"
    );

    const userId = "user-123";
    const initial = await pullSyncSnapshot(userId);
    expect(initial.revision).toBe(0);

    const first = await pushSyncSnapshot(userId, {
      bundle: {
        ...emptyBundle(),
        books: [
          {
            id: "book-1",
            title: "First",
            authors: ["Author"],
            totalPages: 100,
            currentPage: 0,
            source: "manual",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-06-28T00:00:00.000Z",
          },
        ],
      },
      tombstones: [],
    });

    expect(first.revision).toBe(1);
    expect(first.bundle.books).toHaveLength(1);

    const second = await pushSyncSnapshot(userId, {
      bundle: {
        ...emptyBundle(),
        books: [
          {
            id: "book-1",
            title: "First",
            authors: ["Author"],
            totalPages: 100,
            currentPage: 42,
            source: "manual",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-06-29T00:00:00.000Z",
          },
        ],
      },
      tombstones: [],
    });

    expect(second.revision).toBe(2);
    expect(second.bundle.books[0]?.currentPage).toBe(42);

    const { __syncStore } = globalThis as typeof globalThis & {
      __syncStore?: Map<string, unknown>;
    };
    __syncStore?.clear();

    const reloaded = await getSyncSnapshot(userId);
    expect(reloaded?.revision).toBe(2);
    expect(reloaded?.bundle.books[0]?.currentPage).toBe(42);
  });
});
