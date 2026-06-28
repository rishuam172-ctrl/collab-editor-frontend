'use client';

import { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '@/lib/store/useDocumentStore';
import { useAuthStore } from '@/lib/store/useAuthStore';


interface Props {
  editable: boolean;
}

export default function DocumentTitle({ editable }: Props) {
  const title = useDocumentStore((s) => s.currentDoc?.title ?? 'Untitled Document');
  const updateTitle = useDocumentStore((s) => s.updateTitle);
  const saveTitle = useDocumentStore((s) => s.saveTitle);
  const token = useAuthStore((s) => s.token);
  const [editing, setEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    const trimmed = localTitle.trim() || 'Untitled Document';
    updateTitle(trimmed);
    if (token) saveTitle(trimmed, token);
  };

  if (!editable) {
    return (
      <h1 className="max-w-md truncate text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h1>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={localTitle}
        onChange={(e) => {
          setLocalTitle(e.target.value);
          updateTitle(e.target.value);
        }}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBlur();
          if (e.key === 'Escape') {
            setLocalTitle(title);
            setEditing(false);
          }
        }}
        className="max-w-md border-b-2 border-indigo-500 bg-transparent text-lg font-semibold outline-none dark:text-white"
        aria-label="Document title"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex max-w-md cursor-pointer items-center gap-2 truncate text-lg font-semibold text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
      title="Click to rename"
    >
      <span className="truncate">{title || 'Untitled Document'}</span>
      <span className="text-sm opacity-60 transition-opacity group-hover:opacity-60"> ✏️</span>
    </button>
  );
}
