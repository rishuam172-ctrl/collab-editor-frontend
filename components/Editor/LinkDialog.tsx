"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
  initialData?: { url: string; text: string; openInNewTab: boolean } | null;
}

export default function LinkDialog({
  editor,
  open,
  onClose,
  initialData,
}: Props) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);

  useEffect(() => {
    if (open && editor) {
      const attrs = editor.getAttributes("link");
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, "");
      setUrl(initialData?.url ?? attrs.href ?? "");
      setText(initialData?.text ?? selectedText ?? "");
      setOpenInNewTab(initialData?.openInNewTab ?? attrs.target === "_blank");
    }
  }, [open, editor, initialData]);

  const handleInsert = () => {
    if (!editor || !url.trim()) return;

    const href = url.startsWith("http") ? url : `https://${url}`;
    const target = openInNewTab ? "_blank" : undefined;

    if (text.trim()) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: text.trim(),
          marks: [
            {
              type: "link",
              attrs: {
                href,
                target,
                rel: openInNewTab ? "noopener noreferrer" : null,
              },
            },
          ],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href, target })
        .run();
    }
    onClose();
  };

  const handleRemove = () => {
    editor?.chain().focus().unsetLink().run();
    onClose();
  };

  const isEditing = editor?.isActive("link");

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <Dialog.Title className="text-lg font-semibold dark:text-white">
            {isEditing ? "Edit Link" : "Insert Link"}
          </Dialog.Title>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Display Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Link text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
              />
              Open in new tab
            </label>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={handleInsert}
              disabled={!url.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isEditing ? "Update" : "Insert"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Remove Link
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
