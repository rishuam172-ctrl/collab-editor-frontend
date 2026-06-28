'use client';

import { useEffect, useState } from 'react';

function formatRelativeTime(iso: string | null) {
  if (!iso) return 'Not saved yet';
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'Saved just now';
  if (seconds < 60) return `Last saved ${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return 'Last saved 1 minute ago';
  if (minutes < 60) return `Last saved ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  return `Last saved ${hours} hour${hours > 1 ? 's' : ''} ago`;
}

interface Props {
  lastSavedAt: string | null;
  role: string;
  wordCount?: number;
}

export default function BottomStatusBar({ lastSavedAt, role, wordCount = 0 }: Props) {
  const [label, setLabel] = useState(formatRelativeTime(lastSavedAt));

  useEffect(() => {
    setLabel(formatRelativeTime(lastSavedAt));
    const interval = setInterval(() => setLabel(formatRelativeTime(lastSavedAt)), 15000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-2 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
      <span>{label}</span>
      <div className="flex items-center gap-4">
        <span>{wordCount} words</span>
        <span className="capitalize">{role}</span>
      </div>
    </div>
  );
}
