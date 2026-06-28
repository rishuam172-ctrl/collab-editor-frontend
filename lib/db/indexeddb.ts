import { openDB, DBSchema, IDBPDatabase } from "idb";

interface DocDB extends DBSchema {
  documents: {
    key: string;
    value: {
      id: string;
      title: string;
      content: unknown;
      version: number;
      updatedAt: string;
      syncStatus: "synced" | "pending" | "conflict";
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      documentId: string;
      operations: unknown[];
      baseVersion: number;
      timestamp: number;
      retries: number;
    };
  };
}

let db: IDBPDatabase<DocDB>;

export async function getDB() {
  if (!db) {
    db = await openDB<DocDB>("collab-editor", 1, {
      upgrade(db) {
        db.createObjectStore("documents", { keyPath: "id" });
        db.createObjectStore("syncQueue", { keyPath: "id" });
      },
    });
  }
  return db;
}

export async function saveDocumentLocally(doc: DocDB["documents"]["value"]) {
  const database = await getDB();
  await database.put("documents", doc);
}

export async function getLocalDocument(id: string) {
  const database = await getDB();
  return database.get("documents", id);
}

export async function getAllLocalDocuments() {
  const database = await getDB();
  return database.getAll("documents");
}

export async function addToSyncQueue(
  item: Omit<DocDB["syncQueue"]["value"], "id" | "retries">,
) {
  const database = await getDB();
  const id = crypto.randomUUID();
  await database.put("syncQueue", { ...item, id, retries: 0 });
  return id;
}

/** Keep only the latest pending sync per document to avoid queue floods. */
export async function upsertSyncQueueItem(
  item: Omit<DocDB["syncQueue"]["value"], "id" | "retries">,
) {
  const database = await getDB();
  const existing = await database.getAll("syncQueue");
  const tx = database.transaction("syncQueue", "readwrite");

  for (const entry of existing) {
    if (entry.documentId === item.documentId) {
      await tx.store.delete(entry.id);
    }
  }

  const id = crypto.randomUUID();
  await tx.store.put({ ...item, id, retries: 0 });
  await tx.done;
  return id;
}

/** Remove duplicate/stale queue entries, keeping the newest per document. */
export async function dedupeSyncQueue() {
  const database = await getDB();
  const all = await database.getAll("syncQueue");
  const latestByDoc = new Map<string, DocDB["syncQueue"]["value"]>();

  for (const item of all) {
    const existing = latestByDoc.get(item.documentId);
    if (!existing || item.timestamp >= existing.timestamp) {
      latestByDoc.set(item.documentId, item);
    }
  }

  const tx = database.transaction("syncQueue", "readwrite");
  await tx.store.clear();
  for (const item of latestByDoc.values()) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function getSyncQueue() {
  const database = await getDB();
  return database.getAll("syncQueue");
}

export async function removeSyncQueueItem(id: string) {
  const database = await getDB();
  await database.delete("syncQueue", id);
}

export async function removeSyncQueueForDocument(documentId: string) {
  const database = await getDB();
  const existing = await database.getAll("syncQueue");
  const tx = database.transaction("syncQueue", "readwrite");

  for (const entry of existing) {
    if (entry.documentId === documentId) {
      await tx.store.delete(entry.id);
    }
  }

  await tx.done;
}
