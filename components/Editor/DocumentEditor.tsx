
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useEditor, EditorContent, type Editor, type JSONContent } from '@tiptap/react';
import { useDocumentStore } from '@/lib/store/useDocumentStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useEditorUIStore } from '@/lib/store/useEditorUIStore';
import { normalizeDocumentContent } from '@/lib/api/documents';
import { getEditorExtensions } from '@/lib/editor/extensions';
import SyncStatusBadge from './SyncStatusBadge';
import EditorToolbar from './EditorToolbar';
import VersionHistory from './VersionHistory';
import CollaboratorsList from './CollaboratorsList';
import DocumentTitle from './DocumentTitle';
import ShareModal from './ShareModal';
import LinkDialog from './LinkDialog';
import AIPanel from './AIPanel';
import CommentsPanel from './CommentsPanel';
import BottomStatusBar from './BottomStatusBar';
import EditorSkeleton from './EditorSkeleton';
import { io, Socket } from 'socket.io-client';
import { startSyncEngine, stopSyncEngine } from '@/lib/sync/engine';
import { usePageNumbers } from '@/lib/editor/usePageNumbers';
import { PagedEditor } from './PageCards';
import { ArrowLeft } from "lucide-react";
// import { PageCards } from './PageCards';


interface Props {
  documentId: string;
}

export default function DocumentEditor({ documentId }: Props) {
  const { token, user, logout } = useAuthStore();
  const {
    currentDoc,
    loadError,
    isLoading,
    loadDocument,
    updateContent,
    setRemoteContent,
    isOnline,
    isSyncing,
    setOnline,
    clearDocument,
    lastSavedAt,
    addOnlineUser,
    removeOnlineUser,
  } = useDocumentStore();


  // ✅ Fix — select each value individually
const activePanel = useEditorUIStore((s) => s.activePanel);
const togglePanel = useEditorUIStore((s) => s.togglePanel);
const showShareModal = useEditorUIStore((s) => s.showShareModal);
const setShowShareModal = useEditorUIStore((s) => s.setShowShareModal);
const showLinkDialog = useEditorUIStore((s) => s.showLinkDialog);
const linkDialogData = useEditorUIStore((s) => s.linkDialogData);
const setShowLinkDialog = useEditorUIStore((s) => s.setShowLinkDialog);


  const socketRef = useRef<Socket | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentLoadedRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);
  const [wordCount, setWordCount] = useState(0);

    const [showPageNumbers, setShowPageNumbers] = useState(false);

  const isViewer = currentDoc?.role === 'viewer';
  const editable = !isViewer;




  const insertImageFile = useCallback((file: File) => {
    const ed = editorRef.current;
    if (!ed) return;
    const reader = new FileReader();
    reader.onload = () => {
      ed.chain().focus().setImage({ src: reader.result as string }).run();
    };
    reader.readAsDataURL(file);
  }, []);

  const editor = useEditor({
    extensions: getEditorExtensions(editable),
    content: EMPTY_PLACEHOLDER,
    immediatelyRender: false,
    editable,
    onUpdate: ({ editor: activeEditor }) => {
      setWordCount(activeEditor.storage.characterCount?.words?.() ?? activeEditor.getText().split(/\s+/).filter(Boolean).length);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (token && !isViewer) {
          updateContent(activeEditor.getJSON(), token);
        }
      }, 1000);
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none min-h-[520px] focus:outline-none',
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length || isViewer) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        insertImageFile(file);
        return true;
      },
      handlePaste: (_view, event) => {
        if (isViewer) return false;
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) insertImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
  }, [editable, isViewer, token, insertImageFile]);

  editorRef.current = editor;

    const { pageCount } = usePageNumbers(editor, showPageNumbers);


  useEffect(() => {
    if (token) {
      contentLoadedRef.current = false;
      loadDocument(documentId, token);
      startSyncEngine(token);
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      stopSyncEngine();
      clearDocument();
      contentLoadedRef.current = false;
    };
  }, [documentId, token, loadDocument, clearDocument]);

  // useEffect(() => {
  //   if (!editor) return; // ✅ guard against null editor

  //   if (editor && currentDoc?.content && !contentLoadedRef.current) {
  //     const nextContent = normalizeDocumentContent(currentDoc.content) as JSONContent;
  //     editor.commands.setContent(nextContent, { emitUpdate: false });
  //     setWordCount(editor.getText().split(/\s+/).filter(Boolean).length);
  //     contentLoadedRef.current = true;
  //   }
  // }, [editor, currentDoc?.id, currentDoc?.content]);

  // useEffect(() => {
  //   if (editor && currentDoc?.content && contentLoadedRef.current) {
  //     const nextContent = normalizeDocumentContent(currentDoc.content) as JSONContent;
  //     const currentContent = editor.getJSON();
  //     if (
  //       JSON.stringify(currentContent) !== JSON.stringify(nextContent) &&
  //       !editor.isFocused
  //     ) {
  //       editor.commands.setContent(nextContent, { emitUpdate: false });
  //     }
  //   }
  // }, [currentDoc?.content, editor]);

  // useEffect(() => {
  //   if (editor) editor.setEditable(editable);
  // }, [editor, editable]);



  // ✅ Effect 1 — initial content load
useEffect(() => {
  if (!editor || editor.isDestroyed) return;
  if (currentDoc?.content && !contentLoadedRef.current) {
    const nextContent = normalizeDocumentContent(currentDoc.content) as JSONContent;
    editor.commands.setContent(nextContent, { emitUpdate: false });
    setWordCount(editor.getText().split(/\s+/).filter(Boolean).length);
    contentLoadedRef.current = true;
  }
}, [editor, currentDoc?.id, currentDoc?.content]);

// ✅ Effect 2 — remote content sync
useEffect(() => {
  if (!editor || editor.isDestroyed) return;
  if (currentDoc?.content && contentLoadedRef.current) {
    const nextContent = normalizeDocumentContent(currentDoc.content) as JSONContent;
    const currentContent = editor.getJSON();
    if (
      JSON.stringify(currentContent) !== JSON.stringify(nextContent) &&
      !editor.isFocused
    ) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }
}, [currentDoc?.content, editor]);

// ✅ Effect 3 — editable toggle
useEffect(() => {
  if (!editor || editor.isDestroyed) return;
  editor.setEditable(editable);
}, [editor, editable]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    if (!token || !isOnline) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.emit('join-document', documentId);


    // ✅ Guard here too
socket.on('remote-ops', ({ operations, version, userId }) => {
  if (userId === useAuthStore.getState().user?.id) return;
  if (operations[0]?.type === 'full-replace' && editor && !editor.isDestroyed) {
    const content = normalizeDocumentContent(operations[0].content) as JSONContent;
    editor.commands.setContent(content, { emitUpdate: false });
    setRemoteContent(content, version ?? useDocumentStore.getState().currentDoc?.version ?? 1);
  }
});

    socket.on('user-joined', (data: { userId: string; name?: string; role?: string }) => {
      addOnlineUser({
        id: data.userId,
        name: data.name,
        role: (data.role as 'owner' | 'editor' | 'viewer') ?? 'editor',
      });
    });

    socket.on('user-left', (data: { userId: string }) => {
      removeOnlineUser(data.userId);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave-document', documentId);
      socket.disconnect();
    };
  }, [token, isOnline, documentId, editor, setRemoteContent, addOnlineUser, removeOnlineUser]);




  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (editor && !editor.isDestroyed  && token && !isViewer) {
          updateContent(editor.getJSON(), token);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!isViewer) setShowLinkDialog(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, token, isViewer, updateContent, setShowLinkDialog]);



  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center dark:bg-gray-950">
        <div className="mb-4 text-4xl">📄</div>
        <p className="text-lg text-gray-700 dark:text-gray-300">{loadError}</p>
        <p className="mt-2 text-sm text-gray-500">The document may have been deleted or you may not have access.</p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading && !currentDoc) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <EditorSkeleton />
      </div>
    );
  }

  if (!currentDoc) return null;

  const panelWidth = activePanel ? 'w-80' : 'w-0';


   


  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg flex font-bold text-indigo-600">
           <ArrowLeft className='text-white me-2' /> <span>CollabDocs</span>
          </Link>
          <div className="hidden h-5 w-px bg-gray-200 dark:bg-gray-700 sm:block" />
          <DocumentTitle editable={editable} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <SyncStatusBadge
            status={currentDoc.syncStatus}
            isOnline={isOnline}
            isSyncing={isSyncing}
          />
          <button
            type="button"
            onClick={() => togglePanel('versions')}
            className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 hover:text-slate-800 dark:border-gray-700 dark:text-gray-300 sm:block"
            title="Version history"
          >
            Versions 
          </button>
          <button
            type="button"
            onClick={() => togglePanel('ai')}
            className="rounded-lg cursor-pointer border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-slate-800 dark:border-gray-700 dark:text-gray-300"
            title="AI Assistant"
          >
            AI
          </button>
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="rounded-lg cursor-pointer bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Share
          </button>
          <CollaboratorsList />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</span>
            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
              title="Profile / Logout"
            >
              {(user?.name ?? 'U').charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar tabs */}
        <aside className="hidden w-12 flex-col items-center gap-2 border-r border-gray-200 bg-white py-4 dark:border-gray-800 dark:bg-gray-900 md:flex">
          <SidebarTab
            active={activePanel === 'comments'}
            onClick={() => togglePanel('comments')}
            title="Comments"
            icon="💬"
          />
          <SidebarTab
            active={activePanel === 'versions'}
            onClick={() => togglePanel('versions')}
            title="Version History"
            icon="🕐"
          />
          <SidebarTab
            active={activePanel === 'activity'}
            onClick={() => togglePanel('activity')}
            title="Activity"
            icon="📋"
          />
        </aside>

        {/* Main editor area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* {editable && <EditorToolbar editor={editor} />} */}
       {editable && (
        <EditorToolbar
          editor={editor}
          showPageNumbers={showPageNumbers}
          onTogglePageNumbers={() => setShowPageNumbers((v) => !v)}
          pageCount={pageCount}
        />
      )}
          <div className="flex-1 overflow-y-auto pb-16">
            {isViewer && (
              <div className="mx-auto max-w-4xl px-6 pt-4">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  View only — you cannot edit this document
                </span>
              </div>
            )}

            <div
              className="mx-auto max-w-4xl px-6 py-8"
              onDragOver={(e) => {
                if (!isViewer) e.preventDefault();
              }}
              onDrop={(e) => {
                if (isViewer) return;
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith('image/')) insertImageFile(file);
              }}
       
       >
      
<div className="relative mx-auto max-w-4xl px-6 py-8 bg-gray-100 dark:bg-gray-950">
  <PagedEditor editor={editor} />
</div>


            </div>
          </div>
        </div>




        {/* Right panel */}
        <div className={`${panelWidth} shrink-0 overflow-hidden transition-all duration-200`}>
          {activePanel === 'ai' && (
            <AIPanel editor={editor} onClose={() => togglePanel('ai')} />
          )}
          {activePanel === 'comments' && (
            <CommentsPanel documentId={documentId} onClose={() => togglePanel('comments')} />
          )}
          {activePanel === 'versions' && (
            <div className="h-full border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <VersionHistory documentId={documentId} embedded onClose={() => togglePanel('versions')} />
            </div>
          )}
          {activePanel === 'activity' && (
            <ActivityPanel onClose={() => togglePanel('activity')} />
          )}
        </div>
      </div>

      <BottomStatusBar lastSavedAt={lastSavedAt} role={currentDoc.role} wordCount={wordCount} />

      {!isOnline && (
        <div className="fixed bottom-12 left-1/2 z-40 -translate-x-1/2 rounded-full bg-amber-500 px-5 py-2 text-sm font-medium text-white shadow-lg">
          Offline — changes saved locally and will sync when reconnected
        </div>
      )}

      <ShareModal
        documentId={documentId}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      <LinkDialog
        editor={editor}
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        initialData={linkDialogData}
      />
    </div>
  );
}

const EMPTY_PLACEHOLDER = { type: 'doc', content: [{ type: 'paragraph' }] };

function SidebarTab({
  active,
  onClick,
  title,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-lg transition ${
        active
          ? 'bg-indigo-100 dark:bg-indigo-900'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {icon}
    </button>
  );
}

function ActivityPanel({ onClose }: { onClose: () => void }) {
  const lastSavedAt = useDocumentStore((s) => s.lastSavedAt);
  const collaborators = useDocumentStore((s) => s.collaborators);
  const onlineUsers = useDocumentStore((s) => s.onlineUsers);

  return (
    
    <div className="flex h-full flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h2 className="font-semibold dark:text-white">Activity</h2>
        <button type="button" onClick={onClose} className="text-amber-300 hover:text-gray-600">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 text-sm">
          {lastSavedAt && (
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="font-medium dark:text-white">Document saved</div>
              <div className="text-xs text-gray-500">{new Date(lastSavedAt).toLocaleString()}</div>
            </div>
          )}
          {onlineUsers.map((u) => (
            <div key={u.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="font-medium dark:text-white">{u.name ?? u.email} joined</div>
              <div className="text-xs text-green-600">Online now</div>
            </div>
          ))}
          {collaborators.length === 0 && onlineUsers.length === 0 && !lastSavedAt && (
            <p className="py-8 text-center text-gray-400">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}
