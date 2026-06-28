// lib/editor/usePageNumbers.ts
import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';

export function usePageNumbers(editor: Editor | null, enabled: boolean) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!editor || !enabled) return;

    const updatePageNumbers = () => {
      const editorEl = document.querySelector('.ProseMirror');
      if (!editorEl) return;

      // Remove old page number labels
      editorEl.querySelectorAll('[data-page-number]').forEach((el) => el.remove());

      const pageBreaks = editorEl.querySelectorAll('[data-page-break]');
      setPageCount(pageBreaks.length + 1);

      // Add page number after each break
      pageBreaks.forEach((pb, i) => {
        const label = document.createElement('div');
        label.setAttribute('data-page-number', String(i + 2));
        label.style.cssText = `
          text-align: right;
          font-size: 11px;
          color: #94a3b8;
          padding: 4px 0;
          pointer-events: none;
          user-select: none;
        `;
        label.textContent = `Page ${i + 2}`;
        pb.after(label);
      });
    };

    updatePageNumbers();
    editor.on('update', updatePageNumbers);
    return () => { editor.off('update', updatePageNumbers); };
  }, [editor, enabled]);

  return { pageCount };
}