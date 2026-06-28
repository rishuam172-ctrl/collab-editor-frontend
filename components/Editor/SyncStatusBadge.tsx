'use client';

interface Props {
  status: 'synced' | 'pending' | 'conflict';
  isOnline: boolean;
  isSyncing: boolean;
}

export default function SyncStatusBadge({ status, isOnline, isSyncing }: Props) {
  if (!isOnline) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Offline
      </span>
    );
  }

  if (isSyncing || status === 'pending') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
        Saving...
      </span>
    );
  }

  if (status === 'conflict') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Conflict
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      Saved
    </span>
  );
}
