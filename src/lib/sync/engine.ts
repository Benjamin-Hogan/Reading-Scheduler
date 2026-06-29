export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error" | "signed_out";

export interface SyncState {
  status: SyncStatus;
  signedIn: boolean;
  email: string | null;
  userId: string | null;
  lastSyncedAt: string | null;
  remoteRevision: number;
  error: string | null;
}

type SyncListener = (state: SyncState) => void;

const DEBOUNCE_MS = 400;

let state: SyncState = {
  status: "signed_out",
  signedIn: false,
  email: null,
  userId: null,
  lastSyncedAt: null,
  remoteRevision: 0,
  error: null,
};

const listeners = new Set<SyncListener>();
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushQueued = false;
let syncing = false;

function setState(partial: Partial<SyncState>) {
  state = { ...state, ...partial };
  for (const listener of listeners) {
    listener(state);
  }
}

export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function getSyncState(): SyncState {
  return state;
}

async function fetchSession(): Promise<{ signedIn: boolean; email?: string; userId?: string }> {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return { signedIn: false };
  return res.json();
}

async function pullRemote(): Promise<{
  revision: number;
  bundle: import("@/lib/db/schema").ExportBundle;
  tombstones: import("@/lib/db/schema").Tombstone[];
  empty: boolean;
} | null> {
  const res = await fetch("/api/sync");
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error("Failed to pull cloud data");
  }
  return res.json();
}

async function pushRemote(payload: {
  bundle: import("@/lib/db/schema").ExportBundle;
  tombstones: import("@/lib/db/schema").Tombstone[];
}): Promise<{
  revision: number;
  syncedAt: string;
  bundle: import("@/lib/db/schema").ExportBundle;
  tombstones: import("@/lib/db/schema").Tombstone[];
}> {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to push cloud data");
  }
  return res.json();
}

export async function refreshSession(): Promise<boolean> {
  const session = await fetchSession();
  if (!session.signedIn) {
    setState({
      signedIn: false,
      email: null,
      userId: null,
      status: "signed_out",
    });
    return false;
  }

  setState({
    signedIn: true,
    email: session.email ?? null,
    userId: session.userId ?? null,
    status: state.status === "error" ? "error" : state.status,
  });
  return true;
}

export async function pullSync(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) {
    setState({ status: "offline" });
    return;
  }

  const signedIn = state.signedIn || (await refreshSession());
  if (!signedIn) return;

  if (syncing && !force) return;
  syncing = true;
  setState({ status: "syncing", error: null });

  try {
    const { applySyncedBundle, exportData, isLocalDataEmpty } = await import(
      "@/lib/db/export-import"
    );
    const { getPendingTombstones, pruneOldTombstones } = await import("@/lib/db/tombstones");

    const remote = await pullRemote();
    if (!remote) {
      setState({ status: "signed_out", signedIn: false });
      return;
    }

    const localEmpty = await isLocalDataEmpty();
    const syncedAt = new Date().toISOString();

    if (remote.empty && !localEmpty) {
      const localBundle = await exportData();
      const tombstones = await getPendingTombstones();
      const pushed = await pushRemote({
        bundle: localBundle,
        tombstones: tombstones.map((t) => ({
          recordId: t.recordId,
          table: t.table,
          deletedAt: t.deletedAt,
        })),
      });
      await applySyncedBundle(pushed.bundle, pushed.tombstones, pushed.syncedAt, state.userId);
      setState({
        status: "synced",
        remoteRevision: pushed.revision,
        lastSyncedAt: pushed.syncedAt,
      });
      return;
    }

    if (!remote.empty) {
      await applySyncedBundle(remote.bundle, remote.tombstones, syncedAt, state.userId);
      setState({
        status: "synced",
        remoteRevision: remote.revision,
        lastSyncedAt: syncedAt,
      });
    } else {
      setState({ status: "synced", remoteRevision: remote.revision });
    }

    await pruneOldTombstones();
  } catch (e) {
    setState({
      status: "error",
      error: e instanceof Error ? e.message : "Sync failed",
    });
  } finally {
    syncing = false;
  }
}

export async function pushSync(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) {
    pushQueued = true;
    setState({ status: "offline" });
    return;
  }

  const signedIn = state.signedIn || (await refreshSession());
  if (!signedIn) return;

  if (syncing && !force) {
    pushQueued = true;
    return;
  }

  syncing = true;
  setState({ status: "syncing", error: null });

  try {
    const { exportData, applySyncedBundle } = await import("@/lib/db/export-import");
    const { getPendingTombstones, pruneOldTombstones } = await import("@/lib/db/tombstones");

    const localBundle = await exportData();
    const tombstones = await getPendingTombstones();
    const pushed = await pushRemote({
      bundle: localBundle,
      tombstones: tombstones.map((t) => ({
        recordId: t.recordId,
        table: t.table,
        deletedAt: t.deletedAt,
      })),
    });

    await applySyncedBundle(pushed.bundle, pushed.tombstones, pushed.syncedAt, state.userId);
    await pruneOldTombstones();

    setState({
      status: "synced",
      remoteRevision: pushed.revision,
      lastSyncedAt: pushed.syncedAt,
    });
  } catch (e) {
    setState({
      status: "error",
      error: e instanceof Error ? e.message : "Sync failed",
    });
  } finally {
    syncing = false;
    if (pushQueued) {
      pushQueued = false;
      void pushSync(true);
    }
  }
}

export async function syncNow(): Promise<void> {
  await pullSync(true);
  await pushSync(true);
}

export function scheduleSyncPush(): void {
  if (typeof window === "undefined") return;
  if (!state.signedIn) return;

  if (pushTimer) {
    clearTimeout(pushTimer);
  }
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushSync();
  }, DEBOUNCE_MS);
}

export async function uploadLocalToCloud(): Promise<void> {
  await pushSync(true);
}

export function initSyncListeners(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    if (pushQueued || state.status === "offline") {
      void syncNow();
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible" && state.signedIn) {
      void pullSync();
    }
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibility);
    if (pushTimer) clearTimeout(pushTimer);
  };
}

export async function bootstrapSync(): Promise<void> {
  const signedIn = await refreshSession();
  if (!signedIn) return;
  await pullSync(true);
}
