// lib/editor/usePageSplit.ts
import { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";

const PAGE_HEIGHT_PX = 1056 - 192; // A4 minus top+bottom padding (96px each)

export function usePageSplit(editor: Editor | null, showPageNumbers: boolean) {
  const [pages, setPages] = useState<{ html: string; pageNum: number }[]>([]);

  useEffect(() => {
    if (!editor) return;

    const splitIntoPages = () => {
      const container = document.createElement("div");
      container.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: 624px; /* 816 - 96*2 padding */
        font-size: 16px;
        line-height: 1.6;
        top: -9999px;
        left: -9999px;
      `;
      document.body.appendChild(container);

      const html = editor.getHTML();
      container.innerHTML = html;

      const children = Array.from(container.children) as HTMLElement[];
      const result: { html: string; pageNum: number }[] = [];
      let currentPageHtml = "";
      let currentHeight = 0;
      let pageNum = 1;

      children.forEach((child) => {
        // Manual page break
        if (child.hasAttribute("data-page-break")) {
          result.push({ html: currentPageHtml, pageNum });
          currentPageHtml = "";
          currentHeight = 0;
          pageNum++;
          return;
        }

        const childHeight =
          child.offsetHeight +
          parseInt(getComputedStyle(child).marginTop || "0") +
          parseInt(getComputedStyle(child).marginBottom || "0");

        if (
          currentHeight + childHeight > PAGE_HEIGHT_PX &&
          currentPageHtml !== ""
        ) {
          result.push({ html: currentPageHtml, pageNum });
          currentPageHtml = child.outerHTML;
          currentHeight = childHeight;
          pageNum++;
        } else {
          currentPageHtml += child.outerHTML;
          currentHeight += childHeight;
        }
      });

      if (currentPageHtml || result.length === 0) {
        result.push({ html: currentPageHtml, pageNum });
      }

      document.body.removeChild(container);
      setPages(result);
    };

    splitIntoPages();
    editor.on("update", splitIntoPages);
    return () => {
      editor.off("update", splitIntoPages);
    };
  }, [editor, showPageNumbers]);

  return { pages, pageCount: pages.length };
}
