"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Book } from "@/lib/db/schema";
import { isStorageAvailable } from "@/lib/db/storage";
import { recordDeletion } from "@/lib/db/tombstones";
import { stampForWrite, stampPartial } from "@/lib/db/write-stamp";
import { scheduleSyncPush } from "@/hooks/use-sync";
import { getSyncState } from "@/lib/sync/engine";
import { generateId } from "@/lib/utils";

import { fetchGoogleBookMetadata } from "@/lib/books/client";
import type { GoogleBookMetadata } from "@/lib/books/types";

function metadataToBookFields(meta: GoogleBookMetadata): Partial<Book> {
  return {
    subtitle: meta.subtitle,
    description: meta.description,
    publishedDate: meta.publishedDate,
    publisher: meta.publisher,
    language: meta.language,
    categories: meta.categories?.length ? meta.categories : undefined,
    previewLink: meta.previewLink,
    isbn: meta.isbn,
    coverUrl: meta.coverUrl,
  };
}

export function useBooks() {
  const books = useLiveQuery(() => db.books.orderBy("createdAt").reverse().toArray(), []);

  const getBook = async (id: string) => db.books.get(id);

  const findByGoogleVolumeId = async (googleVolumeId: string) => {
    const matches = await db.books.filter((b) => b.googleVolumeId === googleVolumeId).toArray();
    return matches[0];
  };

  const getPlanCountForBook = async (bookId: string) =>
    db.planBooks.where("bookId").equals(bookId).count();

  const addBook = async (
    data: Omit<Book, "id" | "createdAt" | "currentPage"> & { currentPage?: number }
  ) => {
    if (!isStorageAvailable()) {
      throw new Error("Storage unavailable — open http://localhost:3000");
    }
    if (data.googleVolumeId) {
      const existing = await findByGoogleVolumeId(data.googleVolumeId);
      if (existing) {
        throw new Error(`"${existing.title}" is already in your library`);
      }
    }
    const book: Book = stampForWrite(
      {
        id: generateId(),
        currentPage: data.currentPage ?? 0,
        status: data.status ?? "want-to-read",
        createdAt: new Date().toISOString(),
        ...data,
      },
      getSyncState().userId
    );
    await db.books.add(book);
    scheduleSyncPush();
    return book;
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    if (!isStorageAvailable()) {
      throw new Error("Storage unavailable — open http://localhost:3000");
    }
    await db.books.update(id, stampPartial(updates, getSyncState().userId));
    scheduleSyncPush();
    return db.books.get(id);
  };

  const deleteBook = async (id: string) => {
    if (!isStorageAvailable()) {
      throw new Error("Storage unavailable — open http://localhost:3000");
    }
    const planCount = await getPlanCountForBook(id);
    if (planCount > 0) {
      throw new Error(
        `This book is used in ${planCount} plan(s). Remove it from those plans before deleting.`
      );
    }
    await recordDeletion("books", id);
    await db.books.delete(id);
    scheduleSyncPush();
  };

  const refreshGoogleMetadata = async (id: string) => {
    const book = await db.books.get(id);
    if (!book?.googleVolumeId) {
      throw new Error("This book has no Google Books link to refresh from");
    }
    const meta = await fetchGoogleBookMetadata(book.googleVolumeId);
    if (!meta) {
      throw new Error("Could not fetch metadata from Google Books");
    }
    const updates = metadataToBookFields(meta);
    if (meta.pageCount && meta.pageCount > 0) {
      Object.assign(updates, { totalPages: meta.pageCount });
    }
    await db.books.update(id, stampPartial(updates, getSyncState().userId));
    scheduleSyncPush();
    return db.books.get(id);
  };

  return {
    books: books ?? [],
    isLoading: books === undefined,
    addBook,
    updateBook,
    deleteBook,
    refreshGoogleMetadata,
    getBook,
    findByGoogleVolumeId,
    getPlanCountForBook,
  };
}

export function useBook(id: string) {
  return useLiveQuery(() => (id ? db.books.get(id) : undefined), [id]);
}
