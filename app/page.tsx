"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../lib/store/useAuthStore";
import Link from "next/link";
import {
  type DocumentItem,
  mapCollaboratorsToDocuments,
} from "@/lib/api/documents";

export default function Dashboard() {
  const { token, user, logout } = useAuthStore();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    let cancelled = false;

    async function loadDocuments() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/documents`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to load documents");
        }

        if (!cancelled) {
          setDocuments(mapCollaboratorsToDocuments(json.data));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load documents",
          );
          setDocuments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  const createDoc = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: "Untitled Document" }),
        },
      );
      const json = await res.json();

      if (!res.ok || !json.data?.id) {
        throw new Error(json.message || "Failed to create document");
      }

      router.push(`/documents/${json.data.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create document",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-xl font-bold text-indigo-600">CollabDocs</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {user?.name}
          </span>
          <button
            onClick={logout}
            className="text-sm cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            My Documents
          </h2>
          <button
            onClick={createDoc}
            className="rounded-lg cursor-pointer bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New Document
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <div className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-2 truncate font-medium text-gray-800 dark:text-white">
                    {doc.title}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        doc.role === "owner"
                          ? "bg-indigo-100 text-indigo-700"
                          : doc.role === "editor"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {doc.role}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {documents.length === 0 && !error && (
              <div className="col-span-3 py-20 text-center text-gray-400">
                No documents yet. Create your first one!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
