"use client";

import { useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import clsx from "clsx";
import { FONT_SIZES } from "@/lib/editor/fontSize";
import { useEditorUIStore } from "@/lib/store/useEditorUIStore";
import { useDocumentStore } from "@/lib/store/useDocumentStore";
import DownloadButton from "./DownloadButton";

interface Props {
  editor: Editor | null;
  showPageNumbers: boolean;
  onTogglePageNumbers: () => void;
  pageCount: number;
}

const FONTS = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Courier New", value: "Courier New, monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
];

const HIGHLIGHTS = [
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#ff00ff",
  "#ff9900",
  "#fce5cd",
  "#d9ead3",
  "#cfe2f3",
  "#d9d2e9",
  "#f4cccc",
];

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        " cursor-pointer rounded px-2 py-1.5 text-sm transition",
        active
          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />;
}

export default function EditorToolbar({
  editor,
  showPageNumbers,
  onTogglePageNumbers,
  pageCount,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setShowLinkDialog = useEditorUIStore((s) => s.setShowLinkDialog);

  const { currentDoc } = useDocumentStore();

  const getCurrentFontSize = useCallback(() => {
    if (!editor) return "16px";
    const attrs = editor.getAttributes("textStyle");
    return attrs.fontSize ?? "16px";
  }, [editor]);

  const increaseFontSize = () => {
    if (!editor) return;
    const current = getCurrentFontSize();
    const idx = FONT_SIZES.indexOf(current);
    const next =
      idx < FONT_SIZES.length - 1
        ? FONT_SIZES[idx + 1]
        : FONT_SIZES[FONT_SIZES.length - 1];
    editor.chain().focus().setFontSize(next).run();
  };

  const decreaseFontSize = () => {
    if (!editor) return;
    const current = getCurrentFontSize();
    const idx = FONT_SIZES.indexOf(current);
    const prev = idx > 0 ? FONT_SIZES[idx - 1] : FONT_SIZES[0];
    editor.chain().focus().setFontSize(prev).run();
  };

  const handleImageUpload = (file: File) => {
    if (!editor || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor
        .chain()
        .focus()
        .setImage({ src: reader.result as string })
        .run();
    };
    reader.readAsDataURL(file);
  };

  const insertTable = () => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  if (!editor) return null;

  const headingValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : editor.isActive("heading", { level: 4 })
          ? "h4"
          : "p";

  const handleDownload = (format: "txt" | "html") => {
    if (!editor || !currentDoc) return;
    const content = format === "html" ? editor.getHTML() : editor.getText();
    const mime = format === "html" ? "text/html" : "text/plain";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentDoc.title ?? "document"}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  // top-[57px]
  return (
    <div className="sticky z-50 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-0.5 px-4 py-2 overflow-visible">
        {/* <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-0.5 overflow-x-auto px-4 py-2"> */}
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          ↩
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          ↪
        </ToolbarButton>
        <Divider />

        {/* Heading */}
        <select
          value={headingValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 | 4 })
                .run();
          }}
          className="rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          title="Heading style"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
        <Divider />

        {/* Font */}
        <select
          value={editor.getAttributes("textStyle").fontFamily ?? ""}
          onChange={(e) => {
            if (e.target.value)
              editor.chain().focus().setFontFamily(e.target.value).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
          className="max-w-[120px] rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          title="Font family"
        >
          {FONTS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <ToolbarButton onClick={decreaseFontSize} title="Decrease font size">
          A−
        </ToolbarButton>
        <ToolbarButton onClick={increaseFontSize} title="Increase font size">
          A+
        </ToolbarButton>
        <Divider />

        {/* Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline code"
        >
          {"</>"}
        </ToolbarButton>
        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align left"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align center"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align right"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        >
          ≡
        </ToolbarButton>
        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive("taskList")}
          title="Task list"
        >
          ☑
        </ToolbarButton>
        <Divider />

        {/* Insert */}
        <ToolbarButton
          onClick={() => setShowLinkDialog(true)}
          active={editor.isActive("link")}
          title="Insert link"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          🖼
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          ―
        </ToolbarButton>
        <ToolbarButton onClick={insertTable} title="Insert table">
          ⊞
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code block"
        >
          {"{ }"}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          ❝
        </ToolbarButton>
        <Divider />

        {/* Colors */}

        <div className="relative group">
          <ToolbarButton onClick={() => {}} title="Text color">
            A
          </ToolbarButton>
          <div className="absolute left-0 top-full z-[999] hidden group-hover:flex flex-wrap gap-1.5 w-36 rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:bg-gray-800 dark:border-gray-700">
            {/* ✅ Remove text color button — reset to default */}
            <button
              type="button"
              title="Remove text color"
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="h-6 w-6 shrink-0 rounded border-2 border-gray-300 bg-white hover:scale-110 transition-transform relative overflow-hidden"
            >
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="block w-full h-0.5 bg-red-500 rotate-45" />
              </span>
            </button>

            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                style={{ backgroundColor: c }}
                className={clsx(
                  "h-6 w-6 shrink-0 cursor-pointer rounded border border-gray-300 hover:scale-110 transition-transform",
                  // ✅ Ring on active color
                  editor.isActive("textStyle", { color: c }) &&
                    "ring-2 ring-offset-1 ring-indigo-500",
                )}
                onClick={() => editor.chain().focus().setColor(c).run()}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="relative group">
          <ToolbarButton onClick={() => {}} title="Highlight color">
            🖍
          </ToolbarButton>
          <div className="absolute left-0 top-full z-[999] hidden group-hover:flex flex-wrap gap-1.5 w-36 rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:bg-gray-800 dark:border-gray-700">
            {/* ✅ Remove highlight button — always first */}
            <button
              type="button"
              title="Remove highlight"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="h-6 w-6 shrink-0 rounded border-2 border-gray-300 bg-white hover:scale-110 transition-transform relative overflow-hidden"
            >
              {/* Red strikethrough line to indicate "remove" */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="block w-full h-0.5 bg-red-500 rotate-45" />
              </span>
            </button>

            {HIGHLIGHTS.map((c) => (
              <button
                key={c}
                type="button"
                style={{ backgroundColor: c }}
                className={clsx(
                  "h-6 w-6 shrink-0 cursor-pointer rounded border border-gray-300 hover:scale-110 transition-transform",
                  // ✅ Ring on active highlight
                  editor.isActive("highlight", { color: c }) &&
                    "ring-2 ring-offset-1 ring-indigo-500",
                )}
                onClick={() =>
                  editor.chain().focus().toggleHighlight({ color: c }).run()
                }
                title={c}
              />
            ))}
          </div>
        </div>

        <Divider />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          title="Clear formatting"
        >
          ✕
        </ToolbarButton>

        <DownloadButton
          editor={editor}
          documentTitle={currentDoc?.title ?? "document"}
        />
      </div>
    </div>
  );
}
