// lib/editor/useAutoPagination.ts
import { useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';

const PAGE_CONTENT_HEIGHT = 1056 - 192; // A4 height minus top+bottom padding (96px each)

export function useAutoPagination(
  editor: Editor | null,
  containerRef: React.RefObject<HTMLDivElement>,
  setPageCount: (n: number) => void
) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor || !containerRef.current) return;

    const paginate = () => {
      const container = containerRef.current;
      if (!container) return;

      // Remove all existing virtual page separators
      container.querySelectorAll('[data-virtual-page-sep]').forEach((el) => el.remove());

      const proseMirror = container.querySelector('.ProseMirror') as HTMLElement;
      if (!proseMirror) return;

      const children = Array.from(proseMirror.children) as HTMLElement[];
      if (!children.length) {
        setPageCount(1);
        return;
      }

      const containerTop = proseMirror.getBoundingClientRect().top;
      let currentPageBottom = containerTop + PAGE_CONTENT_HEIGHT;
      let pageCount = 1;

      children.forEach((child) => {
        // Skip our own injected separators
        if (child.hasAttribute('data-virtual-page-sep')) return;
        // Skip manual page breaks (already handled by CSS)
        if (child.hasAttribute('data-page-break')) {
          pageCount++;
          currentPageBottom = child.getBoundingClientRect().bottom + PAGE_CONTENT_HEIGHT;
          return;
        }

        const rect = child.getBoundingClientRect();
        const childBottom = rect.bottom;

        if (childBottom > currentPageBottom + 2) {
          // This child overflows the current page — inject a separator before it
          pageCount++;
          currentPageBottom = rect.top + PAGE_CONTENT_HEIGHT;

          const sep = document.createElement('div');
          sep.setAttribute('data-virtual-page-sep', String(pageCount));
          sep.style.cssText = `
            width: calc(100% + 192px);
            margin-left: -96px;
            height: 40px;
            background: #e8eaed;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 108px;
            font-size: 11px;
            color: #999;
            user-select: none;
            pointer-events: none;
            box-shadow: inset 0 4px 6px -4px rgba(0,0,0,0.08),
                        inset 0 -4px 6px -4px rgba(0,0,0,0.08);
          `;
          sep.textContent = `Page ${pageCount}`;
          child.before(sep);
        }
      });

      setPageCount(pageCount);
    };

    // Debounced via rAF for performance
    const schedule = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(paginate);
    };

    // Run on editor update
    editor.on('update', schedule);

    // Also run on first load
    schedule();

    // Run on window resize
    window.addEventListener('resize', schedule);

    // MutationObserver catches image loads and other DOM changes
    const observer = new MutationObserver(schedule);
    const proseMirror = containerRef.current?.querySelector('.ProseMirror');
    if (proseMirror) {
      observer.observe(proseMirror, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      editor.off('update', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Clean up separators on unmount
      containerRef.current
        ?.querySelectorAll('[data-virtual-page-sep]')
        .forEach((el) => el.remove());
    };
  }, [editor, containerRef, setPageCount]);
}