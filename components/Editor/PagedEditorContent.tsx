// components/editor/PagedEditorContent.tsx
'use client';

import { Editor, EditorContent } from '@tiptap/react';
import { usePageSplit } from '@/lib/editor/usePageSplit';

interface Props {
  editor: Editor | null;
  showPageNumbers: boolean;
  isViewer: boolean;
}

export default function PagedEditorContent({ editor, showPageNumbers, isViewer }: Props) {
  const { pages, pageCount } = usePageSplit(editor, showPageNumbers);

  if (!editor) return null;

  // Single page / editing mode — use native EditorContent for full TipTap interactivity
  return (
    <div className="editor-pages-wrapper">
      {/* Real editable page — TipTap renders here */}
      <div className="editor-page">
        <EditorContent editor={editor} />
        {showPageNumbers && pageCount > 0 && (
          <div className="editor-page-number">1</div>
        )}
      </div>

      {/* Read-only overflow pages rendered as HTML previews */}
      {showPageNumbers && pages.slice(1).map((page) => (
        <div key={page.pageNum} className="editor-page">
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
          <div className="editor-page-number">{page.pageNum}</div>
        </div>
      ))}
    </div>
  );
}