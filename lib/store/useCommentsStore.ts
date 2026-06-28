import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Comment {
  id: string;
  documentId: string;
  authorId: string;
  authorName: string;
  text: string;
  selectionFrom?: number;
  selectionTo?: number;
  resolved: boolean;
  createdAt: string;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

interface CommentsStore {
  comments: Record<string, Comment[]>;
  getComments: (documentId: string) => Comment[];
  addComment: (
    comment: Omit<Comment, "id" | "createdAt" | "replies" | "resolved">,
  ) => void;
  addReply: (
    documentId: string,
    commentId: string,
    reply: Omit<CommentReply, "id" | "createdAt">,
  ) => void;
  resolveComment: (documentId: string, commentId: string) => void;
  deleteComment: (documentId: string, commentId: string) => void;
}

export const useCommentsStore = create<CommentsStore>()(
  persist(
    (set, get) => ({
      comments: {},

      getComments: (documentId) => get().comments[documentId] ?? [],

      addComment: (comment) =>
        set((state) => {
          const existing = state.comments[comment.documentId] ?? [];
          const newComment: Comment = {
            ...comment,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            resolved: false,
            replies: [],
          };
          return {
            comments: {
              ...state.comments,
              [comment.documentId]: [...existing, newComment],
            },
          };
        }),

      addReply: (documentId, commentId, reply) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [documentId]: (state.comments[documentId] ?? []).map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    replies: [
                      ...c.replies,
                      {
                        ...reply,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  }
                : c,
            ),
          },
        })),

      resolveComment: (documentId, commentId) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [documentId]: (state.comments[documentId] ?? []).map((c) =>
              c.id === commentId ? { ...c, resolved: true } : c,
            ),
          },
        })),

      deleteComment: (documentId, commentId) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [documentId]: (state.comments[documentId] ?? []).filter(
              (c) => c.id !== commentId,
            ),
          },
        })),
    }),
    { name: "comments-storage" },
  ),
);
