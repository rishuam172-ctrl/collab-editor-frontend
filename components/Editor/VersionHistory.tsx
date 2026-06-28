"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useDocumentStore } from "@/lib/store/useDocumentStore";
import { useEditorUIStore } from "@/lib/store/useEditorUIStore";

interface VersionItem {
  id: string;
  version_number: number;
  created_at: string;
  label?: string;
  User?: { name?: string; email?: string };
}

interface Props {
  documentId: string;
  onClose?: () => void;
  embedded?: boolean;
}

export default function VersionHistory({
  documentId,
  onClose,
  embedded,
}: Props) {
  const [open, setOpen] = useState(embedded ?? false);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { token } = useAuthStore();
  const loadDocument = useDocumentStore((s) => s.loadDocument);
  const showToast = useEditorUIStore((s) => s.showToast);

  const loadVersions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/versions/${documentId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      setVersions(Array.isArray(json.data) ? json.data : []);
      setOpen(true);
    } catch {
      showToast("Failed to load versions", "error");
    } finally {
      setLoading(false);
    }
  };

  const createSnapshot = async () => {
    if (!token) return;

    const label = `Snapshot ${new Date().toLocaleString()}`; // dummy default label

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/versions/${documentId}/snapshot`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ label }),
      },
    );

    if (res.ok) {
      showToast("Snapshot saved", "success");
      await loadVersions();
    } else {
      showToast("Failed to save snapshot", "error");
    }
  };

  const restore = async (versionId: string) => {
    if (!token) return;
    if (
      !window.confirm(
        "Restore this version? Current state will be snapshotted first.",
      )
    )
      return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/versions/${documentId}/restore/${versionId}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
    );

    if (res.ok) {
      showToast("Version restored", "success");
      await loadDocument(documentId, token);
      setOpen(false);
      onClose?.();
    } else {
      showToast("Failed to restore version", "error");
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  if (embedded) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="font-semibold dark:text-white">Version History</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createSnapshot}
              className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
            >
              Save Version
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
        <VersionList
          versions={versions}
          loading={loading}
          onLoad={loadVersions}
          onRestore={restore}
          onPreview={setPreviewId}
          previewId={previewId}
        />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={loadVersions}
        disabled={loading}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
        title="Version history"
      >
        {loading ? "..." : "History"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40">
          <div className="flex h-full w-96 flex-col bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold dark:text-white">
                Version History
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={createSnapshot}
                  className="rounded-lg bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                >
                  Save Version
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <VersionList
              versions={versions}
              loading={loading}
              onLoad={loadVersions}
              onRestore={restore}
              onPreview={setPreviewId}
              previewId={previewId}
            />
          </div>
        </div>
      )}
    </>
  );
}

function VersionList({
  versions,
  loading,
  onLoad,
  onRestore,
  onPreview,
  previewId,
}: {
  versions: VersionItem[];
  loading: boolean;
  onLoad: () => void;
  onRestore: (id: string) => void;
  onPreview: (id: string | null) => void;
  previewId: string | null;
}) {
  if (versions.length === 0 && !loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-gray-400">No saved versions yet.</p>
        <button
          type="button"
          onClick={onLoad}
          className="mt-3 text-sm text-indigo-600 hover:underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}
      <div className="space-y-3">
        {versions.map((v) => (
          <div
            key={v.id}
            className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium dark:text-white">
                  v{v.version_number}
                </div>
                <div className="text-xs text-gray-500">
                  {v.User?.name ?? "Unknown"} ·{" "}
                  {new Date(v.created_at).toLocaleString()}
                </div>
                {v.label && (
                  <div className="mt-1 text-xs text-indigo-500">{v.label}</div>
                )}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onRestore(v.id)}
                className="text-xs text-indigo-600 hover:underline"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => onPreview(previewId === v.id ? null : v.id)}
                className="text-xs text-gray-600 hover:underline dark:text-gray-400"
              >
                {previewId === v.id ? "Hide" : "Preview"}
              </button>
              <button
                type="button"
                className="text-xs text-gray-600 hover:underline dark:text-gray-400"
                title="Compare with current (coming soon)"
              >
                Compare
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
