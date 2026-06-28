import { create } from "zustand";
import {
  saveDocumentLocally,
  getLocalDocument,
  upsertSyncQueueItem,
} from "../db/indexeddb";
import {
  mapServerDocument,
  normalizeDocumentContent,
  fetchCollaborators,
  updateDocumentTitleApi,
  pullDocumentChanges,
  type CollaboratorItem,
} from "../api/documents";
import { triggerSync } from "../sync/engine";

interface Document {
  id: string;
  title: string;
  content: unknown;
  version: number;
  role: string;
  syncStatus: "synced" | "pending" | "conflict";
  updatedAt?: string;
}

interface DocumentStore {
  currentDoc: Document | null;
  loadError: string | null;
  isLoading: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  lastSavedAt: string | null;
  collaborators: CollaboratorItem[];
  onlineUsers: CollaboratorItem[];
  setOnline: (online: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  loadDocument: (id: string, token: string) => Promise<void>;
  updateContent: (content: unknown, token: string) => Promise<void>;
  setRemoteContent: (content: unknown, version: number) => Promise<void>;
  updateTitle: (title: string) => void;
  saveTitle: (title: string, token: string) => Promise<void>;
  clearDocument: () => void;
  loadCollaborators: (documentId: string, token: string) => Promise<void>;
  setCollaborators: (collaborators: CollaboratorItem[]) => void;
  addOnlineUser: (user: CollaboratorItem) => void;
  removeOnlineUser: (userId: string) => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  currentDoc: null,
  loadError: null,
  isLoading: false,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  lastSavedAt: null,
  collaborators: [],
  onlineUsers: [],

  setOnline: (online) => set({ isOnline: online }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  clearDocument: () =>
    set({
      currentDoc: null,
      loadError: null,
      collaborators: [],
      onlineUsers: [],
      lastSavedAt: null,
    }),
  setCollaborators: (collaborators) => set({ collaborators }),
  addOnlineUser: (user) =>
    set((state) => {
      if (state.onlineUsers.some((u) => u.id === user.id)) return state;
      return { onlineUsers: [...state.onlineUsers, user] };
    }),
  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u.id !== userId),
    })),

  loadCollaborators: async (documentId, token) => {
    try {
      const data = await fetchCollaborators(documentId, token);
      set({ collaborators: data });
    } catch {
      // Non-fatal
    }
  },

  loadDocument: async (id, token) => {
    set({ loadError: null, isLoading: true });

    const local = await getLocalDocument(id);
    if (local) {
      set({
        currentDoc: {
          ...local,
          content: normalizeDocumentContent(local.content),
        } as Document,
        lastSavedAt: local.updatedAt ?? null,
      });
    }

    if (!navigator.onLine) {
      set({ isLoading: false });
      if (!local) {
        set({ loadError: "Document not available offline yet." });
      }
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();

      if (!res.ok || !json.data) {
        throw new Error(json.message || "Document not found");
      }

      const serverDoc = mapServerDocument(json.data, json.role);
      const preferLocal =
        local &&
        local.syncStatus === "pending" &&
        local.version >= serverDoc.version;

      if (!local || (!preferLocal && serverDoc.version >= local.version)) {
        await saveDocumentLocally(serverDoc);
        set({
          currentDoc: serverDoc,
          lastSavedAt: serverDoc.updatedAt ?? null,
        });
      } else if (preferLocal) {
        set({
          currentDoc: {
            ...local,
            content: normalizeDocumentContent(local.content),
            role: serverDoc.role,
          } as Document,
        });
      }

      try {
        const pull = await pullDocumentChanges(id, serverDoc.version, token);
        if (pull.content) {
          const pulledContent = normalizeDocumentContent(pull.content);
          const current = get().currentDoc;
          if (current && pull.version > current.version) {
            const updated = {
              ...current,
              content: pulledContent,
              version: pull.version,
              syncStatus: "synced" as const,
              updatedAt: current.updatedAt ?? new Date().toISOString(),
            };
            await saveDocumentLocally(updated);
            set({ currentDoc: updated });
          }
        }
      } catch {
        // Pull sync is best-effort
      }

      await get().loadCollaborators(id, token);
    } catch (error) {
      if (!local) {
        set({
          loadError:
            error instanceof Error ? error.message : "Failed to load document",
          currentDoc: null,
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateContent: async (content, token) => {
    const { currentDoc } = get();
    if (!currentDoc || currentDoc.role === "viewer") return;

    const now = new Date().toISOString();
    const updated = {
      ...currentDoc,
      content,
      syncStatus: "pending" as const,
      updatedAt: now,
    };

    await saveDocumentLocally(updated);
    set({ currentDoc: updated, lastSavedAt: now });

    await upsertSyncQueueItem({
      documentId: currentDoc.id,
      operations: [{ type: "full-replace", content }],
      baseVersion: currentDoc.version,
      timestamp: Date.now(),
    });

    triggerSync(token);
  },

  setRemoteContent: async (content, version) => {
    const { currentDoc } = get();
    if (!currentDoc) return;

    const updated = {
      ...currentDoc,
      content: normalizeDocumentContent(content),
      version,
      syncStatus: "synced" as const,
      updatedAt: new Date().toISOString(),
    };

    await saveDocumentLocally(updated);
    set({ currentDoc: updated, lastSavedAt: updated.updatedAt ?? null });
  },

  updateTitle: (title) => {
    const { currentDoc } = get();
    if (!currentDoc || currentDoc.role === "viewer") return;
    const updated = {
      ...currentDoc,
      title,
      updatedAt: currentDoc.updatedAt ?? new Date().toISOString(),
    };
    saveDocumentLocally({
      id: updated.id,
      title: updated.title,
      content: updated.content,
      version: updated.version,
      updatedAt: updated.updatedAt,
      syncStatus: updated.syncStatus,
    });
    set({ currentDoc: updated });
  },

  saveTitle: async (title, token) => {
    const { currentDoc } = get();
    if (!currentDoc || currentDoc.role === "viewer") return;

    try {
      await updateDocumentTitleApi(currentDoc.id, title, token);
      const updated = {
        ...currentDoc,
        title,
        updatedAt: new Date().toISOString(),
      };
      await saveDocumentLocally({
        id: updated.id,
        title: updated.title,
        content: updated.content,
        version: updated.version,
        updatedAt: updated.updatedAt,
        syncStatus: updated.syncStatus,
      });
      set({ currentDoc: updated });
    } catch {
      // Title stays local
    }
  },
}));
