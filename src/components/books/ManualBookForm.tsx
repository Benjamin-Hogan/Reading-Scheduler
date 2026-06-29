"use client";

import { useState } from "react";
import type { BookFormat, BookSource, BookStatus } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface BookFormData {
  title: string;
  subtitle?: string;
  authors: string[];
  totalPages: number;
  coverUrl?: string;
  source: BookSource;
  googleVolumeId?: string;
  isbn?: string;
  description?: string;
  publishedDate?: string;
  publisher?: string;
  language?: string;
  categories?: string[];
  format?: BookFormat;
  status?: BookStatus;
  notes?: string;
  tags?: string[];
  personalRating?: number;
  startedAt?: string;
  finishedAt?: string;
  previewLink?: string;
}

interface ManualBookFormProps {
  initial?: Partial<BookFormData>;
  onSubmit: (data: BookFormData) => void | Promise<void>;
  submitLabel?: string;
  showMetadata?: boolean;
}

const FORMATS: { value: BookFormat; label: string }[] = [
  { value: "physical", label: "Physical" },
  { value: "ebook", label: "E-book" },
  { value: "audiobook", label: "Audiobook" },
];

const STATUSES: { value: BookStatus; label: string }[] = [
  { value: "want-to-read", label: "Want to read" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
];

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ManualBookForm({
  initial,
  onSubmit,
  submitLabel = "Add book",
  showMetadata = true,
}: ManualBookFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [author, setAuthor] = useState(initial?.authors?.join(", ") ?? "");
  const [totalPages, setTotalPages] = useState(initial?.totalPages?.toString() ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [publishedDate, setPublishedDate] = useState(initial?.publishedDate ?? "");
  const [publisher, setPublisher] = useState(initial?.publisher ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "");
  const [categories, setCategories] = useState(initial?.categories?.join(", ") ?? "");
  const [format, setFormat] = useState<BookFormat | "">(initial?.format ?? "");
  const [status, setStatus] = useState<BookStatus>(initial?.status ?? "want-to-read");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tags, setTags] = useState(initial?.tags?.join(", ") ?? "");
  const [personalRating, setPersonalRating] = useState(
    initial?.personalRating?.toString() ?? ""
  );
  const [startedAt, setStartedAt] = useState(initial?.startedAt ?? "");
  const [finishedAt, setFinishedAt] = useState(initial?.finishedAt ?? "");
  const [isbn, setIsbn] = useState(initial?.isbn ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pages = parseInt(totalPages, 10);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!pages || pages < 1) {
      setError("Valid page count is required");
      return;
    }
    const rating = personalRating ? parseInt(personalRating, 10) : undefined;
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      setError("Rating must be between 1 and 5");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        authors: splitList(author),
        totalPages: pages,
        coverUrl: coverUrl.trim() || undefined,
        source: initial?.source ?? "manual",
        googleVolumeId: initial?.googleVolumeId,
        isbn: isbn.trim() || undefined,
        description: description.trim() || undefined,
        publishedDate: publishedDate.trim() || undefined,
        publisher: publisher.trim() || undefined,
        language: language.trim() || undefined,
        categories: splitList(categories),
        format: format || undefined,
        status,
        notes: notes.trim() || undefined,
        tags: splitList(tags),
        personalRating: rating,
        startedAt: startedAt || undefined,
        finishedAt: finishedAt || undefined,
        previewLink: initial?.previewLink,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Basics</h3>
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author(s)</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Comma-separated"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pages">Total pages *</Label>
            <Input
              id="pages"
              type="number"
              min={1}
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <Input id="isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover">Cover URL</Label>
          <Input id="cover" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
        </div>
      </div>

      {showMetadata && (
        <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Details</h3>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="published">Published</Label>
              <Input
                id="published"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                placeholder="e.g. 2024 or 2024-03-15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input id="publisher" value={publisher} onChange={(e) => setPublisher(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. en"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categories">Categories</Label>
              <Input
                id="categories"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                placeholder="Comma-separated"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value as BookFormat | "")}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="">Not set</option>
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {showMetadata && (
        <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Your notes</h3>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="fiction, book-club"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rating">Your rating (1–5)</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={personalRating}
                onChange={(e) => setPersonalRating(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="started">Started</Label>
              <Input
                id="started"
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finished">Finished</Label>
              <Input
                id="finished"
                type="date"
                value={finishedAt}
                onChange={(e) => setFinishedAt(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
