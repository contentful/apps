import { mergeAttributes, Node } from '@tiptap/core';

/**
 * Preserves any HTML element that TipTap doesn't natively understand.
 * Stored as an atom (non-editable) block node so the round-trip
 * HTML → visual → HTML keeps the original markup intact.
 */
export const RawHtmlBlock = Node.create({
  name: 'rawHtmlBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: el => el.getAttribute('data-raw-html') ?? '',
        renderHTML: attrs => ({ 'data-raw-html': attrs.html }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="raw-html-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'raw-html-block' })];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.setAttribute('contenteditable', 'false');
      dom.className = 'rte-raw-html-block';

      const badge = document.createElement('span');
      badge.className = 'rte-raw-html-badge';
      badge.textContent = 'HTML';

      const code = document.createElement('code');
      code.className = 'rte-raw-html-code';
      code.textContent = node.attrs.html;

      dom.appendChild(badge);
      dom.appendChild(code);
      return { dom };
    };
  },
});
