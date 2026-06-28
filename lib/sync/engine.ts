import {
  dedupeSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  removeSyncQueueForDocument,
  saveDocumentLocally,
  getLocalDocument,
} from "../db/indexeddb";
import { useDocumentStore } from "../store/useDocumentStore";

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;
let rateLimitedUntil = 0;
let lastPushAt = 0;
let currentToken: string | null = null;

const SYNC_INTERVAL_MS = 3000;
const MIN_PUSH_GAP_MS = 1000;
const RATE_LIMIT_BACKOFF_MS = 30000;

export function startSyncEngine(token: string) {
  currentToken = token;
  if (syncInterval) return;

  void processSyncQueue(token);
  syncInterval = setInterval(() => processSyncQueue(token), SYNC_INTERVAL_MS);
}

export function stopSyncEngine() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  currentToken = null;
  rateLimitedUntil = 0;
  lastPushAt = 0;
}

export function triggerSync(token?: string) {
  const t = token ?? currentToken;
  if (t && navigator.onLine) {
    void processSyncQueue(t);
  }
}

async function processSyncQueue(token: string) {
  if (isSyncing || !navigator.onLine) return;
  if (Date.now() < rateLimitedUntil) return;
  if (Date.now() - lastPushAt < MIN_PUSH_GAP_MS) return;

  isSyncing = true;
  useDocumentStore.getState().setIsSyncing(true);

  try {
    await dedupeSyncQueue();
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    const item = [...queue].sort((a, b) => a.timestamp - b.timestamp)[0];

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/sync/push`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentId: item.documentId,
          operations: item.operations,
          baseVersion: item.baseVersion,
        }),
      },
    );

    if (response.status === 429) {
      rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
      return;
    }

    if (response.ok) {
      const json = await response.json();
      const localDoc = await getLocalDocument(item.documentId);

      if (localDoc) {
        const syncedDoc = {
          ...localDoc,
          version: json.version ?? localDoc.version,
          syncStatus: "synced" as const,
        };
        await saveDocumentLocally(syncedDoc);

        const current = useDocumentStore.getState().currentDoc;
        if (current?.id === item.documentId) {
          useDocumentStore.setState({
            currentDoc: {
              ...current,
              version: syncedDoc.version,
              syncStatus: "synced",
            },
            lastSavedAt: new Date().toISOString(),
          });
        }
      }

      await removeSyncQueueForDocument(item.documentId);
      lastPushAt = Date.now();
      return;
    }

    if (response.status === 409) {
      const localDoc = await getLocalDocument(item.documentId);
      if (localDoc) {
        await saveDocumentLocally({ ...localDoc, syncStatus: "conflict" });
        const current = useDocumentStore.getState().currentDoc;
        if (current?.id === item.documentId) {
          useDocumentStore.setState({
            currentDoc: { ...current, syncStatus: "conflict" },
          });
        }
      }
      await removeSyncQueueItem(item.id);
      return;
    }

    if (response.status >= 500) {
      rateLimitedUntil = Date.now() + 10000;
    }
  } catch {
    rateLimitedUntil = Date.now() + 5000;
  } finally {
    isSyncing = false;
    useDocumentStore.getState().setIsSyncing(false);
  }
}

interface SyncOperation {
  type: string;
  content?: unknown;
  [key: string]: unknown;
}

export async function queueOperation(
  documentId: string,
  operations: SyncOperation[],
  baseVersion: number,
  token: string,
) {
  const { upsertSyncQueueItem } = await import("../db/indexeddb");
  await upsertSyncQueueItem({
    documentId,
    operations,
    baseVersion,
    timestamp: Date.now(),
  });

  triggerSync(token);
}
