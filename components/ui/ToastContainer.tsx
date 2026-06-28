"use client";

import { useEffect } from "react";
import { useEditorUIStore } from "@/lib/store/useEditorUIStore";
import clsx from "clsx";

export default function ToastContainer() {
  const toast = useEditorUIStore((s) => s.toast);
  const clearToast = useEditorUIStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 3500);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-gray-800",
  };

  return (
    <div
      className={clsx(
        "fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg",
        colors[toast.type],
      )}
    >
      {toast.message}
    </div>
  );
}
