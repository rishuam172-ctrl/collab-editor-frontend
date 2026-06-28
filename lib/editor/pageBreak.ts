// lib/editor/extensions/pageBreak.ts
import { Node, mergeAttributes } from '@tiptap/core';

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  parseHTML() {
    return [{ tag: 'div[data-page-break]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-page-break': '',
      style: 'page-break-after: always; border-top: 2px dashed #cbd5e1; margin: 16px 0; position: relative;',
    })];
  },
 addCommands() {
    const name = this.name;
    return {
      insertPageBreak: () => (props: any) => {
        return props.commands.insertContent({ type: name });
      },
    } as any;
  },
});