


import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions";
import { Node, mergeAttributes, type RawCommands } from "@tiptap/core";
import {
  TextAlign,
  Color,
  Highlight,
  FontFamily,
  Image,
  Table,
  TableRow,
  TableCell,
  TableHeader,
  TaskList,
  TaskItem,
} from "./customExtensions";

const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: "div[data-page-break]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-page-break": "",
      }),
    ];
  },

addCommands() {
  return {
    insertPageBreak: () => ({ commands }: { commands: any }) => {
      return commands.insertContent({ type: this.name });
    },
  } as unknown as RawCommands;
},
});

export function getEditorExtensions(editable: boolean) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      codeBlock: { HTMLAttributes: { class: "code-block" } },
      blockquote: { HTMLAttributes: { class: "blockquote" } },
    }),
    Underline,
    Color,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: "editor-link" },
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: { class: "editor-image" },
    }),
    Table,
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem,
    PageBreak,
    Placeholder.configure({
      placeholder: editable
        ? "Start writing your document…"
        : "This document is read-only.",
    }),
  ];
}

export { TextStyle } from "./customExtensions";
export { PageBreak };

// ==============================================================
// import StarterKit from "@tiptap/starter-kit";
// import Underline from "@tiptap/extension-underline";
// import Link from "@tiptap/extension-link";
// import { Placeholder } from "@tiptap/extensions";
// import { Node, mergeAttributes } from "@tiptap/core";
// import {
//   TextAlign,
//   Color,
//   Highlight,
//   FontFamily,
//   Image,
//   Table,
//   TableRow,
//   TableCell,
//   TableHeader,
//   TaskList,
//   TaskItem,
// } from "./customExtensions";

// // ✅ PageBreak extension defined inline
// const PageBreak = Node.create({
//   name: "pageBreak",
//   group: "block",
//   atom: true, // treat as a single unit (not editable inside)

//   parseHTML() {
//     return [{ tag: "div[data-page-break]" }];
//   },

//   renderHTML({ HTMLAttributes }) {
//     return [
//       "div",
//       mergeAttributes(HTMLAttributes, {
//         "data-page-break": "",
//       }),
//     ];
//   },

//   addCommands() {
//   return {
//     insertPageBreak:
//       () =>
//       ({ commands }: { commands: any }) => {
//         return commands.insertContent({ type: this.name });
//       },
//   } as any;
// },
// });

// export function getEditorExtensions(editable: boolean) {
//   return [
//     StarterKit.configure({
//       heading: { levels: [1, 2, 3, 4] },
//       codeBlock: { HTMLAttributes: { class: "code-block" } },
//       blockquote: { HTMLAttributes: { class: "blockquote" } },
//     }),
//     Underline,
//     Color,
//     FontFamily,
//     Highlight.configure({ multicolor: true }),
//     TextAlign.configure({ types: ["heading", "paragraph"] }),
//     Link.configure({
//       openOnClick: false,
//       HTMLAttributes: { class: "editor-link" },
//     }),
//     Image.configure({
//       inline: false,
//       allowBase64: true,
//       HTMLAttributes: { class: "editor-image" },
//     }),
//     Table,
//     TableRow,
//     TableHeader,
//     TableCell,
//     TaskList,
//     TaskItem,
//     PageBreak, // ✅ added here
//     Placeholder.configure({
//       placeholder: editable
//         ? "Start writing your document…"
//         : "This document is read-only.",
//     }),
//   ];
// }

// export { TextStyle } from "./customExtensions";
// export { PageBreak };
