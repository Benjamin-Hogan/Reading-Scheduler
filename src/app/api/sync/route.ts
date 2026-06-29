import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/session";
import {
  deleteSyncSnapshot,
  pullSyncSnapshot,
  pushSyncSnapshot,
  snapshotIsEmpty,
} from "@/lib/sync/store";
import type { SyncPushRequest } from "@/lib/sync/types";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const snapshot = await pullSyncSnapshot(session.userId);
  return NextResponse.json({
    revision: snapshot.revision,
    updatedAt: snapshot.updatedAt,
    bundle: snapshot.bundle,
    tombstones: snapshot.tombstones,
    empty: snapshotIsEmpty(snapshot),
  });
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: SyncPushRequest;
  try {
    body = (await request.json()) as SyncPushRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.bundle?.version !== 1) {
    return NextResponse.json({ error: "Unsupported bundle version" }, { status: 400 });
  }

  const snapshot = await pushSyncSnapshot(session.userId, {
    bundle: body.bundle,
    tombstones: body.tombstones ?? [],
  });

  const syncedAt = new Date().toISOString();
  return NextResponse.json({
    revision: snapshot.revision,
    updatedAt: snapshot.updatedAt,
    syncedAt,
    bundle: snapshot.bundle,
    tombstones: snapshot.tombstones,
  });
}

export async function DELETE() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await deleteSyncSnapshot(session.userId);
  return NextResponse.json({ ok: true });
}
