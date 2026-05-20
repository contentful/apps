import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import type { Block, Document, Inline, Mark, Text, TopLevelBlock } from '@contentful/rich-text-types';

function makeText(value: string, marks: Mark[] = []): Text {
  return { nodeType: 'text', value, marks, data: {} };
}

function convertInlines(node: ChildNode, marks: Mark[] = []): (Inline | Text)[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = node.textContent ?? '';
    if (!value) return [];
    return [makeText(value, marks)];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const inherited = [...marks];

  if (tag === 'b' || tag === 'strong') inherited.push({ type: MARKS.BOLD });
  else if (tag === 'i' || tag === 'em') inherited.push({ type: MARKS.ITALIC });
  else if (tag === 'u') inherited.push({ type: MARKS.UNDERLINE });
  else if (tag === 'code') inherited.push({ type: MARKS.CODE });
  else if (tag === 'sup') inherited.push({ type: MARKS.SUPERSCRIPT });
  else if (tag === 'sub') inherited.push({ type: MARKS.SUBSCRIPT });
  else if (tag === 's' || tag === 'del' || tag === 'strike') inherited.push({ type: MARKS.STRIKETHROUGH });

  if (tag === 'a') {
    const href = el.getAttribute('href') ?? '';
    const children: (Inline | Text)[] = Array.from(el.childNodes).flatMap(n => convertInlines(n, inherited));
    if (children.length === 0) children.push(makeText(el.textContent ?? '', inherited));
    return [{ nodeType: INLINES.HYPERLINK, data: { uri: href }, content: children }];
  }

  return Array.from(el.childNodes).flatMap(n => convertInlines(n, inherited));
}

function makeParagraph(nodes: (Inline | Text)[]): Block {
  return {
    nodeType: BLOCKS.PARAGRAPH,
    data: {},
    content: nodes.length > 0 ? nodes : [makeText('')],
  } as Block;
}

function convertListItem(li: Element): Block {
  const content: Block[] = [];
  let inlineBuffer: (Inline | Text)[] = [];

  function flushBuffer() {
    if (inlineBuffer.length > 0) {
      content.push(makeParagraph(inlineBuffer));
      inlineBuffer = [];
    }
  }

  for (const child of Array.from(li.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as Element;
      const tag = childEl.tagName.toLowerCase();
      if (tag === 'ul' || tag === 'ol') {
        flushBuffer();
        const nested = convertBlock(childEl);
        if (nested) content.push(nested as Block);
      } else if (tag === 'p') {
        flushBuffer();
        const inlines = Array.from(childEl.childNodes).flatMap(n => convertInlines(n));
        content.push(makeParagraph(inlines));
      } else {
        inlineBuffer.push(...convertInlines(child));
      }
    } else {
      inlineBuffer.push(...convertInlines(child));
    }
  }

  flushBuffer();
  if (content.length === 0) content.push(makeParagraph([]));

  return { nodeType: BLOCKS.LIST_ITEM, data: {}, content } as Block;
}

const HEADING_MAP: Record<string, BLOCKS> = {
  h1: BLOCKS.HEADING_1,
  h2: BLOCKS.HEADING_2,
  h3: BLOCKS.HEADING_3,
  h4: BLOCKS.HEADING_4,
  h5: BLOCKS.HEADING_5,
  h6: BLOCKS.HEADING_6,
};

function convertBlock(el: Element): TopLevelBlock | null {
  const tag = el.tagName.toLowerCase();

  if (HEADING_MAP[tag]) {
    const content = Array.from(el.childNodes).flatMap(n => convertInlines(n));
    return {
      nodeType: HEADING_MAP[tag],
      data: {},
      content: content.length > 0 ? content : [makeText('')],
    } as unknown as TopLevelBlock;
  }

  if (tag === 'p') {
    const content = Array.from(el.childNodes).flatMap(n => convertInlines(n));
    return {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: content.length > 0 ? content : [makeText('')],
    } as unknown as TopLevelBlock;
  }

  if (tag === 'blockquote') {
    const inner: Block[] = [];
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const childEl = child as Element;
        const childTag = childEl.tagName.toLowerCase();
        if (childTag === 'p') {
          const inlines = Array.from(childEl.childNodes).flatMap(n => convertInlines(n));
          inner.push(makeParagraph(inlines));
        } else {
          const block = convertBlock(childEl);
          if (block) inner.push(block as Block);
        }
      } else {
        const inlines = convertInlines(child);
        if (inlines.length > 0) {
          const last = inner[inner.length - 1];
          if (last?.nodeType === BLOCKS.PARAGRAPH) {
            (last.content as (Inline | Text)[]).push(...inlines);
          } else {
            inner.push(makeParagraph(inlines));
          }
        }
      }
    }
    if (inner.length === 0) inner.push(makeParagraph([]));
    return { nodeType: BLOCKS.QUOTE, data: {}, content: inner } as unknown as TopLevelBlock;
  }

  if (tag === 'hr') {
    return { nodeType: BLOCKS.HR, data: {}, content: [] } as unknown as TopLevelBlock;
  }

  if (tag === 'ul' || tag === 'ol') {
    const listType = tag === 'ul' ? BLOCKS.UL_LIST : BLOCKS.OL_LIST;
    const items = Array.from(el.children)
      .filter(c => c.tagName.toLowerCase() === 'li')
      .map(li => convertListItem(li));
    return { nodeType: listType, data: {}, content: items } as unknown as TopLevelBlock;
  }

  if (tag === 'pre') {
    const codeEl = el.querySelector('code');
    const text = (codeEl ?? el).textContent ?? '';
    return {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [makeText(text, [{ type: MARKS.CODE }])],
    } as unknown as TopLevelBlock;
  }

  if (tag === 'table') {
    const allTrs: Element[] = [];
    const thead = el.querySelector(':scope > thead');
    const tbody = el.querySelector(':scope > tbody');
    const directRows = Array.from(el.querySelectorAll(':scope > tr'));

    if (thead) allTrs.push(...Array.from(thead.querySelectorAll(':scope > tr')));
    if (tbody) allTrs.push(...Array.from(tbody.querySelectorAll(':scope > tr')));
    if (directRows.length > 0) allTrs.push(...directRows);

    const rows: Block[] = allTrs.map((tr, i) => {
      const cells: Block[] = Array.from(tr.children).map(cell => {
        const isHeader = cell.tagName.toLowerCase() === 'th' || (i === 0 && !!thead);
        const inlines = Array.from(cell.childNodes).flatMap(n => convertInlines(n));
        return {
          nodeType: isHeader ? BLOCKS.TABLE_HEADER_CELL : BLOCKS.TABLE_CELL,
          data: {},
          content: [makeParagraph(inlines)],
        } as Block;
      });
      return { nodeType: BLOCKS.TABLE_ROW, data: {}, content: cells } as Block;
    });

    return { nodeType: BLOCKS.TABLE, data: {}, content: rows } as unknown as TopLevelBlock;
  }

  return null;
}

const CONTAINER_TAGS = new Set(['div', 'section', 'article', 'main', 'header', 'footer', 'nav', 'aside']);
const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'hr', 'pre', 'table']);

function collectBlocks(node: ChildNode): TopLevelBlock[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = (node.textContent ?? '').trim();
    if (!value) return [];
    return [{
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [makeText(node.textContent ?? '')],
    } as unknown as TopLevelBlock];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (BLOCK_TAGS.has(tag)) {
    const block = convertBlock(el);
    return block ? [block] : [];
  }

  if (CONTAINER_TAGS.has(tag)) {
    return Array.from(el.childNodes).flatMap(collectBlocks);
  }

  // Inline element at block level — wrap in a paragraph
  const inlines = convertInlines(el);
  if (inlines.length === 0) return [];
  return [{
    nodeType: BLOCKS.PARAGRAPH,
    data: {},
    content: inlines,
  } as unknown as TopLevelBlock];
}

export function htmlToRichText(html: string): Document {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');
  const content = Array.from(parsed.body.childNodes).flatMap(collectBlocks);

  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: content.length > 0
      ? content
      : [{ nodeType: BLOCKS.PARAGRAPH, data: {}, content: [makeText('')] } as unknown as TopLevelBlock],
  };
}
