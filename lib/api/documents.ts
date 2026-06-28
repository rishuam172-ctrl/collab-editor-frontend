export interface DocumentItem {
  id: string;
  title: string;
  updated_at: string;
  role: "owner" | "editor" | "viewer";
}

export interface CollaboratorItem {
  id: string;
  name?: string;
  email?: string;
  role: "owner" | "editor" | "viewer";
  status?: string;
}

interface CollaboratorRow {
  role: string;
  Document?: {
    id: string;
    title: string;
    updated_at?: string;
    version?: number;
  };
}

export const EMPTY_EDITOR_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function normalizeDocumentContent(content: unknown) {
  if (!content) return EMPTY_EDITOR_CONTENT;

  let parsed = content;

  if (typeof content === "string") {
    try {
      parsed = JSON.parse(content);
    } catch {
      return EMPTY_EDITOR_CONTENT;
    }
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "type" in parsed &&
    (parsed as { type: string }).type === "doc"
  ) {
    return parsed;
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    Object.keys(parsed as object).length === 0
  ) {
    return EMPTY_EDITOR_CONTENT;
  }

  return EMPTY_EDITOR_CONTENT;
}

export function mapCollaboratorsToDocuments(rows: unknown): DocumentItem[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row): row is CollaboratorRow => Boolean(row?.Document?.id))
    .map((row) => ({
      id: row.Document!.id,
      title: row.Document!.title ?? "Untitled Document",
      updated_at: row.Document!.updated_at ?? new Date().toISOString(),
      role: row.role as DocumentItem["role"],
    }));
}

export function mapServerDocument(data: Record<string, unknown>, role: string) {
  return {
    id: data.id as string,
    title: (data.title as string) || "Untitled Document",
    content: normalizeDocumentContent(data.content),
    version: (data.version as number) ?? 1,
    role,
    syncStatus: "synced" as const,
    updatedAt: (data.updated_at as string) ?? new Date().toISOString(),
  };
}

export async function fetchCollaborators(documentId: string, token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/collaborators`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to load collaborators");
  return (json.data ?? []) as CollaboratorItem[];
}

export async function inviteCollaborator(
  documentId: string,
  email: string,
  role: string,
  token: string,
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/collaborators`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, role }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to invite collaborator");
  return json;
}

export async function updateCollaboratorRoleApi(
  documentId: string,
  userId: string,
  role: string,
  token: string,
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/collaborators/${userId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update role");
  return json;
}

export async function removeCollaboratorApi(
  documentId: string,
  userId: string,
  token: string,
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/collaborators/${userId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to remove collaborator");
  return json;
}

export async function updateDocumentTitleApi(
  documentId: string,
  title: string,
  token: string,
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update title");
  return json;
}

export async function pullDocumentChanges(
  documentId: string,
  version: number,
  token: string,
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/sync/pull?documentId=${documentId}&version=${version}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to pull changes");
  return json;
}
