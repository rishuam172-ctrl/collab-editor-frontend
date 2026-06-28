import { create } from "zustand";

type Panel = "ai" | "comments" | "versions" | "activity" | null;

interface EditorUIStore {
  activePanel: Panel;
  showShareModal: boolean;
  showLinkDialog: boolean;
  linkDialogData: { url: string; text: string; openInNewTab: boolean } | null;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  setActivePanel: (panel: Panel) => void;
  togglePanel: (panel: Exclude<Panel, null>) => void;
  setShowShareModal: (show: boolean) => void;
  setShowLinkDialog: (
    show: boolean,
    data?: EditorUIStore["linkDialogData"],
  ) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;
}

export const useEditorUIStore = create<EditorUIStore>((set) => ({
  activePanel: null,
  showShareModal: false,
  showLinkDialog: false,
  linkDialogData: null,
  toast: null,

  setActivePanel: (panel) => set({ activePanel: panel }),
  togglePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
    })),
  setShowShareModal: (show) => set({ showShareModal: show }),
  setShowLinkDialog: (show, data = null) =>
    set({ showLinkDialog: show, linkDialogData: data }),
  showToast: (message, type = "info") => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
}));
