"use client";

import { Editor, EditorContent } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

const PAGE_HEIGHT = 1056;
const PAGE_PADDING_X = 48;
const PAGE_PADDING_Y = 48;
const PAGE_GAP = 24;

export function PagedEditor({ editor }: { editor: Editor | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const el = document.querySelector(".ProseMirror") as HTMLElement | null;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      const contentHeight = el.scrollHeight;
      const usableHeight = PAGE_HEIGHT - PAGE_PADDING_Y * 2;
      setPageCount(Math.max(1, Math.ceil(contentHeight / usableHeight)));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [editor]);

  return (
    <div ref={containerRef} className="relative">
      {/* Page card stack — purely visual */}
      <div className="pointer-events-none absolute inset-0 flex flex-col gap-6">
        {Array.from({ length: pageCount }).map((_, i) => (
          <div
            key={i}
            style={{ height: PAGE_HEIGHT, flexShrink: 0 }}
            className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
          />
        ))}
      </div>

      {/* Actual editor on top */}
      <div
        className="relative z-10"
        style={{
          padding: `${PAGE_PADDING_Y}px ${PAGE_PADDING_X}px`,
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
