'use client';

import { useState } from 'react';
import { useCommentsStore } from '@/lib/store/useCommentsStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useDocumentStore } from '@/lib/store/useDocumentStore';
import { useEditorUIStore } from '@/lib/store/useEditorUIStore';

interface Props {
  documentId: string;
  onClose: () => void;
}

export default function CommentsPanel({ documentId, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const collaborators = useDocumentStore((s) => s.collaborators);

  // ✅ Fixed — select raw Record, slice by documentId outside the selector
  const allComments = useCommentsStore((s) => s.comments);
  const comments = allComments[documentId] ?? [];

  const addComment = useCommentsStore((s) => s.addComment);
  const addReply = useCommentsStore((s) => s.addReply);
  const resolveComment = useCommentsStore((s) => s.resolveComment);
  const deleteComment = useCommentsStore((s) => s.deleteComment);
  const showToast = useEditorUIStore((s) => s.showToast);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const handleAddComment = () => {
    if (!text.trim() || !user) return;
    addComment({
      documentId,
      authorId: user.id,
      authorName: user.name ?? user.email ?? 'Anonymous',
      text: text.trim(),
    });
    setText('');
    showToast('Comment added', 'success');
  };

  const handleReply = (commentId: string) => {
    if (!replyText.trim() || !user) return;
    addReply(documentId, commentId, {
      authorId: user.id,
      authorName: user.name ?? user.email ?? 'Anonymous',
      text: replyText.trim(),
    });
    setReplyTo(null);
    setReplyText('');
    showToast('Reply added', 'success');
  };

  const handleDelete = (commentId: string) => {
    deleteComment(documentId, commentId);
    showToast('Comment deleted', 'success');
  };

  const insertMention = (name: string) => {
    setText((prev) => `${prev}@${name} `);
    setShowMentions(false);
  };

  const activeComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">Comments</h2>
          {activeComments.length > 0 && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {activeComments.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Add Comment */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value.endsWith('@')) setShowMentions(true);
              else setShowMentions(false);
            }}
            placeholder="Add a comment… Use @ to mention"
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {showMentions && collaborators.length > 0 && (
            <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {collaborators.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => insertMention(c.name ?? c.email ?? 'user')}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  @{c.name ?? c.email}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddComment}
          disabled={!text.trim()}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Add Comment
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeComments.length === 0 && resolvedComments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="mb-2 text-3xl">💬</span>
            <p className="text-sm text-gray-400">No comments yet.</p>
            <p className="text-xs text-gray-400">Start a discussion above!</p>
          </div>
        )}

        {/* Active Comments */}
        {activeComments.map((comment) => (
          <div
            key={comment.id}
            className="mb-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            {/* Comment Header */}
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {comment.authorName}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Comment Text */}
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {comment.text}
            </p>

            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="mt-3 space-y-2">
                {comment.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="ml-3 border-l-2 border-indigo-200 pl-3 dark:border-indigo-800"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {reply.authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-white">
                        {reply.authorName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{reply.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                {replyTo === comment.id ? 'Cancel' : 'Reply'}
              </button>
              <button
                type="button"
                onClick={() => resolveComment(documentId, comment.id)}
                className="text-xs text-green-600 hover:underline dark:text-green-400"
              >
                Resolve
              </button>
              {user?.id === comment.authorId && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>

            {/* Reply Input */}
            {replyTo === comment.id && (
              <div className="mt-2 flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(comment.id);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Resolved Comments */}
        {resolvedComments.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowResolved((v) => !v)}
              className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <span>{showResolved ? '▾' : '▸'}</span>
              Resolved ({resolvedComments.length})
            </button>
            {showResolved && resolvedComments.map((comment) => (
              <div
                key={comment.id}
                className="mb-2 rounded-lg border border-gray-100 bg-gray-50 p-3 opacity-60 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {comment.authorName}
                  </span>
                  <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                    Resolved
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-through">{comment.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}