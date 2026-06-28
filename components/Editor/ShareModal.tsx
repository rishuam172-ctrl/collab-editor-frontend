'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useDocumentStore } from '@/lib/store/useDocumentStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useEditorUIStore } from '@/lib/store/useEditorUIStore';
import {
  inviteCollaborator,
  updateCollaboratorRoleApi,
  removeCollaboratorApi,
} from '@/lib/api/documents';

interface Props {
  documentId: string;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ documentId, open, onClose }: Props) {
  const { token } = useAuthStore();
  const role = useDocumentStore((s) => s.currentDoc?.role);
  const collaborators = useDocumentStore((s) => s.collaborators);
  const loadCollaborators = useDocumentStore((s) => s.loadCollaborators);
  const showToast = useEditorUIStore((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);

  const isOwner = role === 'owner';

  useEffect(() => {
    if (open && token) loadCollaborators(documentId, token);
  }, [open, token, documentId, loadCollaborators]);

  const handleInvite = async () => {
    if (!token || !email.trim()) return;
    setLoading(true);
    try {
      await inviteCollaborator(documentId, email.trim(), inviteRole, token);
      showToast('Collaborator invited successfully', 'success');
      setEmail('');
      await loadCollaborators(documentId, token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!token) return;
    try {
      await updateCollaboratorRoleApi(documentId, userId, newRole, token);
      showToast('Role updated', 'success');
      await loadCollaborators(documentId, token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update role', 'error');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!token) return;
    try {
      await removeCollaboratorApi(documentId, userId, token);
      showToast('Collaborator removed', 'success');
      await loadCollaborators(documentId, token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove', 'error');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
            Share Document
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gray-500">
            Invite people to collaborate on this document.
          </Dialog.Description>

          {isOwner && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Invite User</h3>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="owner">Owner</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={loading || !email.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Invite
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border cursor-pointer border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Existing Collaborators
            </h3>
            {collaborators.length === 0 ? (
              <p className="text-sm text-gray-400">No collaborators yet.</p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {(person.name ?? person.email ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium dark:text-white">
                        {person.name ?? 'Unknown'}
                      </div>
                      <div className="truncate text-xs text-gray-500">{person.email}</div>
                    </div>
                    {isOwner ? (
                      <select
                        value={person.role}
                        onChange={(e) => handleRoleChange(person.id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800"
                      >
                        <option value="owner">Owner</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize dark:bg-gray-800">
                        {person.role}
                      </span>
                    )}
                    <span className="text-xs text-green-600">{person.status ?? 'active'}</span>
                    {isOwner && person.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => handleRemove(person.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute cursor-pointer right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
