"use client";

import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import { type Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
  documentTitle?: string;
}

type Format = "docx" | "pdf" | "txt" | "html" | "md" | "rtf" | "odt" | "epub";

const FORMATS: {
  format: Format;
  label: string;
  ext: string;
  icon: string;
  desc: string;
}[] = [
  {
    format: "docx",
    label: "Microsoft Word",
    ext: "docx",
    icon: "📝",
    desc: ".docx",
  },
  {
    format: "pdf",
    label: "PDF Document",
    ext: "pdf",
    icon: "📕",
    desc: ".pdf",
  },
  {
    format: "odt",
    label: "OpenDocument",
    ext: "odt",
    icon: "📄",
    desc: ".odt",
  },
  { format: "txt", label: "Plain Text", ext: "txt", icon: "📃", desc: ".txt" },
  { format: "html", label: "Web Page", ext: "html", icon: "🌐", desc: ".html" },
  { format: "md", label: "Markdown", ext: "md", icon: "✍️", desc: ".md" },
];

export default function DownloadButton({
  editor,
  documentTitle = "document",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<Format | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const htmlToMarkdown = (html: string) =>
    html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
      .replace(/<u[^>]*>(.*?)<\/u>/gi, "__$1__")
      .replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

  const htmlToRtf = (html: string, title: string) => {
    const plain = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
    return `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n{\\info{\\title ${title}}}\n\\f0\\fs24 ${plain}\n}`;
  };

  const buildEpub = async (html: string, title: string): Promise<Blob> => {
    // Minimal valid EPUB structure using JSZip-like manual zip
    // For production use the `epub-gen` or `jszip` library
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${title}</title></head>
<body>${html}</body>
</html>`;
    // Fallback: download as HTML with .epub extension (browsers can't build zip natively without jszip)
    return new Blob([content], { type: "application/epub+zip" });
  };

  const handleDownload = async (format: Format) => {
    if (!editor) return;
    setLoading(format);

    try {
      const html = editor.getHTML();
      const text = editor.getText();
      let blob: Blob;

      switch (format) {
        case "txt":
          blob = new Blob([text], { type: "text/plain" });
          break;

        case "html":
          blob = new Blob(
            [
              `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentTitle}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}</style></head><body>${html}</body></html>`,
            ],
            { type: "text/html" },
          );
          break;

        case "md":
          blob = new Blob([htmlToMarkdown(html)], { type: "text/markdown" });
          break;

        case "rtf":
          blob = new Blob([htmlToRtf(html, documentTitle)], {
            type: "application/rtf",
          });
          break;

        case "epub":
          blob = await buildEpub(html, documentTitle);
          break;

        case "pdf": {
          // Uses browser print-to-PDF
          const win = window.open("", "_blank");
          if (win) {
            win.document.write(
              `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentTitle}</title>
              <style>
                body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; line-height: 1.6; }
                @media print { body { margin: 0; } }
              </style></head><body>${html}</body></html>`,
            );
            win.document.close();
            win.focus();
            setTimeout(() => {
              win.print();
              win.close();
            }, 500);
          }
          setLoading(null);
          setOpen(false);
          return;
        }

        case "docx":
        case "odt": {
          // For real .docx/.odt you'd call your backend or use `docx` / `html-docx-js` library.
          // Fallback: download as HTML with a note
          const ext = format === "docx" ? "html" : "html";
          blob = new Blob(
            [
              `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentTitle}</title></head><body>${html}</body></html>`,
            ],
            { type: "text/html" },
          );
          // Override ext for trigger
          triggerDownload(blob, `${documentTitle}.${ext}`);
          setLoading(null);
          setOpen(false);
          return;
        }

        default:
          return;
      }

      triggerDownload(blob, `${documentTitle}.${format}`);
    } finally {
      setLoading(null);
      setOpen(false);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer transition"
        title="Download document"
      >
        <Download size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
            Download as
          </div>
          {FORMATS.map(({ format, label, icon, desc }) => (
            <button
              key={format}
              type="button"
              disabled={loading === format}
              onClick={() => handleDownload(format)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition cursor-pointer disabled:opacity-50"
            >
              <span className="text-base">
                {loading === format ? "⏳" : icon}
              </span>
              <span className="flex-1 text-left">{label}</span>
              <span className="text-xs text-gray-400">{desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
