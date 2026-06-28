import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";

/* ── TextStyle (base mark for inline styles) ── */
export const TextStyle = Mark.create({
  name: "textStyle",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (el) => (el as HTMLElement).hasAttribute("style") && null,
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
  addCommands() {
    return {
      removeEmptyTextStyle:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { empty, ranges } = selection;
          if (!empty) return false;
          let hasChanges = false;
          ranges.forEach(({ $from, $to }) => {
            state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
              if (!node.isTextblock) return;
              node.marks.forEach((mark) => {
                if (
                  mark.type.name === this.name &&
                  !mark.attrs.color &&
                  !mark.attrs.fontSize &&
                  !mark.attrs.fontFamily
                ) {
                  tr.removeMark(pos, pos + node.nodeSize, mark.type);
                  hasChanges = true;
                }
              });
            });
          });
          if (hasChanges && dispatch) dispatch(tr);
          return hasChanges;
        },
    };
  },
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
        renderHTML: (attrs) =>
          attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
      },
      fontFamily: {
        default: null,
        parseHTML: (el) =>
          (el as HTMLElement).style.fontFamily?.replace(/['"]+/g, "") || null,
        renderHTML: (attrs) =>
          attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {},
      },
      color: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.color || null,
        renderHTML: (attrs) =>
          attrs.color ? { style: `color: ${attrs.color}` } : {},
      },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textStyle: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
      setFontFamily: (font: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
      setColor: (color: string) => ReturnType;
      unsetColor: () => ReturnType;
      removeEmptyTextStyle: () => ReturnType;
    };
    highlight: {
      setHighlight: (attrs?: { color?: string }) => ReturnType;
      toggleHighlight: (attrs?: { color?: string }) => ReturnType;
      unsetHighlight: () => ReturnType;
    };
    textAlign: {
      setTextAlign: (alignment: string) => ReturnType;
    };
    image: {
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
      }) => ReturnType;
    };
    table: {
      insertTable: (options?: {
        rows?: number;
        cols?: number;
        withHeaderRow?: boolean;
      }) => ReturnType;
    };
    taskList: {
      toggleTaskList: () => ReturnType;
    };
  }
}

export const Color = Extension.create({
  name: "color",
  addExtensions() {
    return [TextStyle];
  },
  addCommands() {
    return {
      setColor:
        (color: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { color }).run(),
      unsetColor:
        () =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { color: null })
            .removeEmptyTextStyle()
            .run(),
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run(),
      setFontFamily:
        (fontFamily: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontFamily }).run(),
      unsetFontFamily:
        () =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { fontFamily: null })
            .removeEmptyTextStyle()
            .run(),
    };
  },
});

export const FontFamily = Extension.create({
  name: "fontFamily",
});

/* ── Highlight ── */
export const Highlight = Mark.create({
  name: "highlight",
  addOptions() {
    return { multicolor: true, HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el) =>
          (el as HTMLElement).getAttribute("data-color") ||
          (el as HTMLElement).style.backgroundColor,
        renderHTML: (attrs) =>
          attrs.color
            ? {
                "data-color": attrs.color,
                style: `background-color: ${attrs.color}`,
              }
            : { style: "background-color: #fef08a" },
      },
    };
  },
  parseHTML() {
    return [{ tag: "mark" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
  addCommands() {
    return {
      setHighlight:
        (attrs?: { color?: string }) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      toggleHighlight:
        (attrs?: { color?: string }) =>
        ({ commands }) =>
          commands.toggleMark(this.name, attrs),
      unsetHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

/* ── TextAlign ── */
export const TextAlign = Extension.create({
  name: "textAlign",
  addOptions() {
    return {
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
      defaultAlignment: "left",
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (el) =>
              (el as HTMLElement).style.textAlign ||
              this.options.defaultAlignment,
            renderHTML: (attrs) =>
              attrs.textAlign === this.options.defaultAlignment
                ? {}
                : { style: `text-align: ${attrs.textAlign}` },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setTextAlign:
        (alignment: string) =>
        ({ commands }) =>
          this.options.alignments.includes(alignment)
            ? this.options.types.every((type: string) =>
                commands.updateAttributes(type, { textAlign: alignment }),
              )
            : false,
    };
  },
});

/* ── Image ── */
export const Image = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,
  addOptions() {
    return { inline: false, allowBase64: true, HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: "max-width:100%;height:auto;",
      }),
    ];
  },
  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; title?: string }) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});

/* ── Table ── */
export const Table = Node.create({
  name: "table",
  group: "block",
  content: "tableRow+",
  isolating: true,
  parseHTML() {
    return [{ tag: "table" }];
  },
  renderHTML() {
    return ["table", { class: "editor-table" }, ["tbody", 0]];
  },
  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = true } = {}) =>
        ({ tr, dispatch, editor }) => {
          const { schema } = editor.state;
          const types = schema.nodes;
          if (!types.table || !types.tableRow || !types.tableCell) return false;

          const headerCells = Array.from({ length: cols }, () =>
            types.tableCell.create(null, types.paragraph.create()),
          );
          const bodyCells = Array.from({ length: cols }, () =>
            types.tableCell.create(null, types.paragraph.create()),
          );

          const tableRows = [];
          if (withHeaderRow) {
            tableRows.push(
              types.tableRow.create(
                null,
                headerCells.map(
                  (c) => types.tableHeader?.create(null, c.content) ?? c,
                ),
              ),
            );
          }
          for (let i = withHeaderRow ? 1 : 0; i < rows; i++) {
            tableRows.push(types.tableRow.create(null, bodyCells));
          }

          const table = types.table.create(null, tableRows);
          if (dispatch) {
            tr.replaceSelectionWith(table).scrollIntoView();
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

export const TableRow = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)*",
  parseHTML() {
    return [{ tag: "tr" }];
  },
  renderHTML() {
    return ["tr", 0];
  },
});

export const TableCell = Node.create({
  name: "tableCell",
  content: "block+",
  isolating: true,
  parseHTML() {
    return [{ tag: "td" }];
  },
  renderHTML() {
    return ["td", 0];
  },
});

export const TableHeader = Node.create({
  name: "tableHeader",
  content: "block+",
  isolating: true,
  parseHTML() {
    return [{ tag: "th" }];
  },
  renderHTML() {
    return ["th", 0];
  },
});

/* ── Task List ── */
export const TaskItem = Node.create({
  name: "taskItem",
  content: "paragraph block*",
  defining: true,
  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: (el) =>
          (el as HTMLElement).getAttribute("data-checked") === "true",
        renderHTML: (attrs) => ({ "data-checked": attrs.checked }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'li[data-type="taskItem"]', priority: 51 }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(HTMLAttributes, { "data-type": "taskItem" }),
      0,
    ];
  },
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const li = document.createElement("li");
      li.setAttribute("data-type", "taskItem");
      Object.entries(HTMLAttributes).forEach(([k, v]) => li.setAttribute(k, v));

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = node.attrs.checked;
      checkbox.addEventListener("change", () => {
        if (typeof getPos === "function") {
          const pos = getPos();
          if (pos === undefined) return;
          editor.view.dispatch(
            editor.view.state.tr.setNodeMarkup(pos, undefined, {
              checked: checkbox.checked,
            }),
          );
        }
      });

      const content = document.createElement("div");
      li.append(checkbox, content);

      return {
        dom: li,
        contentDOM: content,
        update: (updatedNode) => updatedNode.type.name === "taskItem",
      };
    };
  },
});

export const TaskList = Node.create({
  name: "taskList",
  group: "block list",
  content: "taskItem+",
  parseHTML() {
    return [{ tag: 'ul[data-type="taskList"]', priority: 51 }];
  },
  renderHTML() {
    return ["ul", { "data-type": "taskList" }, 0];
  },
  addCommands() {
    return {
      toggleTaskList:
        () =>
        ({ commands }) =>
          commands.toggleList(this.name, "taskItem"),
    };
  },
});
