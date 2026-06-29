import type { SyncFields } from "./schema";

export function nowIso(): string {
  return new Date().toISOString();
}

export function stampForWrite<T extends SyncFields>(
  record: T,
  userId?: string | null
): T {
  return {
    ...record,
    updatedAt: nowIso(),
    ...(userId !== undefined ? { userId } : {}),
  };
}

export function stampPartial<T extends object>(
  updates: Partial<T>,
  userId?: string | null
): Partial<T> & Pick<SyncFields, "updatedAt"> & Pick<SyncFields, "userId"> {
  return {
    ...updates,
    updatedAt: nowIso(),
    ...(userId !== undefined ? { userId } : {}),
  };
}
