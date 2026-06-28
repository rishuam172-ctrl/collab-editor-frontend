"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { useEditorUIStore } from "@/lib/store/useEditorUIStore";

interface Props {
  editor: Editor | null;
  onClose: () => void;
}

const AI_ACTIONS = [
  {
    id: "rewrite",
    label: "Rewrite",
    prompt:
      "Rewrite the selected text to improve clarity and flow while keeping the same meaning.",
  },
  {
    id: "summarize",
    label: "Summarize",
    prompt: "Summarize the following content concisely.",
  },
  {
    id: "grammar",
    label: "Fix Grammar",
    prompt:
      "Fix grammar, spelling, and punctuation errors in the following text.",
  },
  {
    id: "continue",
    label: "Continue Writing",
    prompt: "Continue writing naturally from where this text left off.",
  },
  {
    id: "translate",
    label: "Translate",
    prompt:
      "Translate the following text to English (or specify another language if needed).",
  },
  {
    id: "explain",
    label: "Explain",
    prompt: "Explain the following content in simple, clear language.",
  },
  {
    id: "table",
    label: "Generate Table",
    prompt:
      "Generate a well-structured markdown table based on the following content.",
  },
  {
    id: "bullets",
    label: "Generate Bullet Points",
    prompt: "Convert the following content into clear bullet points.",
  },
];

export default function AIPanel({ editor, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const showToast = useEditorUIStore((s) => s.showToast);

  const getSelectedText = () => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    if (from === to) return editor.getText();
    return editor.state.doc.textBetween(from, to, "\n");
  };

  const runAction = async (action: (typeof AI_ACTIONS)[0]) => {
    if (!editor) return;
    const text = getSelectedText();
    if (!text.trim()) {
      showToast("Select some text or add content first", "info");
      return;
    }

    setLoading(action.id);
    setResult("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/suggest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: action.prompt },
              { role: "user", content: text },
            ],
          }),
        },
      );

      if (!res.ok) throw new Error("AI request failed");

      const data = await res.json();
      setResult(data.data.reply);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "AI request failed",
        "error",
      );
    } finally {
      setLoading(null);
    }
  };

  const insertResult = () => {
    if (!editor || !result) return;
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(result)
        .run();
    } else {
      editor.chain().focus().insertContent(result).run();
    }
    showToast("AI content inserted", "success");
    setResult("");
  };

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          AI Assistant
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-4 text-xs text-gray-500">
          Select text in the editor, then choose an action below.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {AI_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => runAction(action)}
              disabled={loading !== null}
              className="cursor-pointer rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-indigo-950"
            >
              {loading === action.id ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-3 w-3 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  {action.label}
                </span>
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>

        {result && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Result
            </h3>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800 whitespace-pre-wrap">
              {result}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={insertResult}
                className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Insert into Document
              </button>
              <button
                type="button"
                onClick={() => setResult("")}
                className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
