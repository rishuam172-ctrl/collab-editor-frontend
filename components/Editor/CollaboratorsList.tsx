'use client';

import { useDocumentStore } from '@/lib/store/useDocumentStore';

export default function CollaboratorsList() {
  const onlineUsers = useDocumentStore((state) => state.onlineUsers);
  const collaborators = useDocumentStore((state) => state.collaborators);

  const display = onlineUsers.length > 0 ? onlineUsers : collaborators.slice(0, 5);

  return (
<div className="flex items-center">
  {display.length === 0 ? (
    <span className="text-xs text-gray-400">—</span>
  ) : (
    display.map((person, index) => (
      <div
        key={person.id}
        title={`${person.name ?? person.email ?? 'Collaborator'} (${person.role ?? 'member'})`}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-xs font-semibold text-indigo-700 dark:border-gray-900 ${
          index !== 0 ? "-ml-2" : ""
        }`}
        style={{ zIndex: display.length - index }}
      >
        {(person.name ?? person.email ?? 'U')
          .charAt(0)
          .toUpperCase()}

        {onlineUsers.some((u) => u.id === person.id) && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400" />
        )}
      </div>
    ))
  )}

  {collaborators.length > 5 && (
    <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-semibold text-gray-700">
      +{collaborators.length - 5}
    </span>
  )}
</div>
  );
}
