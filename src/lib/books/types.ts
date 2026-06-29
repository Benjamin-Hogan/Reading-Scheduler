export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    publisher?: string;
    language?: string;
    categories?: string[];
    pageCount?: number;
    previewLink?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type?: string;
      identifier?: string;
    }>;
  };
}

export interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
  totalItems?: number;
}

export interface NormalizedBookSearchResult {
  googleVolumeId: string;
  title: string;
  subtitle?: string;
  authors: string[];
  pageCount?: number;
  coverUrl?: string;
  isbn?: string;
  pageCountMissing: boolean;
  publishedDate?: string;
  categories?: string[];
}

export interface GoogleBookMetadata {
  subtitle?: string;
  description?: string;
  publishedDate?: string;
  publisher?: string;
  language?: string;
  categories?: string[];
  previewLink?: string;
  isbn?: string;
  coverUrl?: string;
  pageCount?: number;
}
