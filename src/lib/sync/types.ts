import type { ExportBundle, SyncTableName, Tombstone } from "@/lib/db/schema";

export interface SyncSnapshot {
  userId: string;
  revision: number;
  updatedAt: string;
  bundle: ExportBundle;
  tombstones: Tombstone[];
}

export interface SyncPullResponse {
  revision: number;
  updatedAt: string;
  bundle: ExportBundle;
  tombstones: Tombstone[];
  empty: boolean;
}

export interface SyncPushRequest {
  bundle: ExportBundle;
  tombstones: Tombstone[];
  baseRevision?: number;
}

export interface SyncPushResponse {
  revision: number;
  updatedAt: string;
  syncedAt: string;
  bundle: ExportBundle;
  tombstones: Tombstone[];
}

export const SYNC_TABLES: SyncTableName[] = [
  "books",
  "readingPlans",
  "planBooks",
  "dailyAssignments",
  "settings",
];

export const TOMBSTONE_RETENTION_DAYS = 30;
