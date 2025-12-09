function createTextNode(value: string, marks: Array<{ type: 'bold' | 'italic' | 'underline' }>) {
  return {
    nodeType: 'text',
    value,
    marks,
    data: {},
  };
}

function createParagraph(children: any[]) {
  return {
    nodeType: 'paragraph',
    data: {},
    content: children,
  };
}

function createHeading(level: number, children: any[]) {
  const clamped = Math.min(6, Math.max(1, level));
  return {
    nodeType: `heading-${clamped}`,
    data: {},
    content: children,
  };
}

// Class-based facade for organizing parsing logic. Keeps backward compatibility
// with the existing markdownToRichText function by delegating to it.
export class MarkdownParser {
  private urlToAssetId?: Record<string, string>;
  constructor(urlToAssetId?: Record<string, string>) {
    this.urlToAssetId = urlToAssetId;
  }
  normalizeInput(input: string): string {
    let s = input;
    try {
      s = s
        .replace(/<\s*strong\s*>/gi, '<B>')
        .replace(/<\s*\/\s*strong\s*>/gi, '</B>')
        .replace(/<\s*b\s*>/gi, '<B>')
        .replace(/<\s*\/\s*b\s*>/gi, '</B>')
        .replace(/<\s*em\s*>/gi, '<I>')
        .replace(/<\s*\/\s*em\s*>/gi, '</I>')
        .replace(/<\s*i\s*>/gi, '<I>')
        .replace(/<\s*\/\s*i\s*>/gi, '</I>')
        .replace(/<\s*u\s*>/gi, '<U>')
        .replace(/<\s*\/\s*u\s*>/gi, '</U>');
      s = s.replace(/!\[([^\]]*?)\]\(([\s\S]*?)\)/g, (_m, alt, url) => {
        const cleanUrl = String(url).replace(/\s+/g, '');
        return `![${alt}](${cleanUrl})`;
      });
      s = s.replace(/\[([^\]]*?)\]\(([\s\S]*?)\)/g, (_m, text, url) => {
        const cleanUrl = String(url).replace(/\s+/g, '');
        return `[${text}](${cleanUrl})`;
      });
    } catch {
      // keep original if anything fails
    }
    return s;
  }
  parseSimpleInline(line: string) {
    const nodes: any[] = [];
    let buffer = '';
    let i = 0;
    let bold = false;
    let italic = false;
    let underline = false;
    const flush = () => {
      if (!buffer) return;
      const marks: Array<{ type: 'bold' | 'italic' | 'underline' }> = [];
      if (bold) marks.push({ type: 'bold' });
      if (italic) marks.push({ type: 'italic' });
      if (underline) marks.push({ type: 'underline' });
      nodes.push(createTextNode(buffer, marks));
      buffer = '';
    };
    while (i < line.length) {
      if (line.startsWith('**', i)) {
        flush();
        bold = !bold;
        i += 2;
        continue;
      }
      if (line[i] === '*') {
        if (!(i + 1 < line.length && line[i + 1] === '*')) {
          flush();
          italic = !italic;
          i += 1;
          continue;
        }
      }
      if (line.startsWith('__', i)) {
        flush();
        underline = !underline;
        i += 2;
        continue;
      }
      if (line[i] === '_') {
        if (!(i + 1 < line.length && line[i + 1] === '_')) {
          flush();
          underline = !underline;
          i += 1;
          continue;
        }
      }
      buffer += line[i];
      i += 1;
    }
    flush();
    return nodes;
  }
  parseInline(line: string) {
    const nodes: any[] = [];
    let buffer = '';
    let i = 0;
    let bold = false;
    let italic = false;
    let underline = false;
    const flush = () => {
      if (!buffer) return;
      const marks: Array<{ type: 'bold' | 'italic' | 'underline' }> = [];
      if (bold) marks.push({ type: 'bold' });
      if (italic) marks.push({ type: 'italic' });
      if (underline) marks.push({ type: 'underline' });
      nodes.push(createTextNode(buffer, marks));
      buffer = '';
    };
    while (i < line.length) {
      if (line.startsWith('<A', i)) {
        const m = line.slice(i).match(/^<A\s+href="([^"]*)">/i);
        if (m) {
          const href = m[1];
          const after = i + m[0].length;
          const closeIdx = line.indexOf('</A>', after);
          if (closeIdx !== -1) {
            flush();
            const linkText = line.slice(after, closeIdx);
            const marks: Array<{ type: 'bold' | 'italic' | 'underline' }> = [];
            if (bold) marks.push({ type: 'bold' });
            if (italic) marks.push({ type: 'italic' });
            if (underline) marks.push({ type: 'underline' });
            nodes.push({
              nodeType: 'hyperlink',
              data: { uri: href },
              content: [createTextNode(linkText, marks)],
            });
            i = closeIdx + 4;
            continue;
          }
        }
      }
      if (line.startsWith('<CODE>', i)) {
        const after = i + 6;
        const closeIdx = line.indexOf('</CODE>', after);
        if (closeIdx !== -1) {
          flush();
          const codeText = line.slice(after, closeIdx);
          const marks: any[] = [];
          if (bold) marks.push({ type: 'bold' });
          if (italic) marks.push({ type: 'italic' });
          if (underline) marks.push({ type: 'underline' });
          marks.push({ type: 'code' });
          nodes.push({ nodeType: 'text', value: codeText, marks, data: {} });
          i = closeIdx + 7;
          continue;
        }
      }
      if (line[i] === '[') {
        const textStart = i + 1;
        const textEnd = line.indexOf(']', textStart);
        if (textEnd !== -1 && textEnd + 1 < line.length && line[textEnd + 1] === '(') {
          const urlStart = textEnd + 2;
          const urlEnd = line.indexOf(')', urlStart);
          if (urlEnd !== -1) {
            const linkText = line.slice(textStart, textEnd);
            const url = line.slice(urlStart, urlEnd).trim();
            flush();
            const marks: Array<{ type: 'bold' | 'italic' | 'underline' }> = [];
            if (bold) marks.push({ type: 'bold' });
            if (italic) marks.push({ type: 'italic' });
            if (underline) marks.push({ type: 'underline' });
            nodes.push({
              nodeType: 'hyperlink',
              data: { uri: url },
              content: [createTextNode(linkText, marks)],
            });
            i = urlEnd + 1;
            continue;
          }
        }
      }
      if (line[i] === '!' && i + 1 < line.length && line[i + 1] === '[') {
        const altStart = i + 2;
        const altEnd = line.indexOf(']', altStart);
        if (altEnd !== -1 && altEnd + 1 < line.length && line[altEnd + 1] === '(') {
          const urlStart = altEnd + 2;
          const urlEnd = line.indexOf(')', urlStart);
          if (urlEnd !== -1) {
            const altText = line.slice(altStart, altEnd);
            const url = line.slice(urlStart, urlEnd).trim();
            flush();
            const assetId = this.urlToAssetId?.[url];
            if (assetId) {
              const tokenText = line.slice(i, urlEnd + 1);
              const isStandaloneToken = nodes.length === 0 && tokenText.trim() === line.trim();
              if (isStandaloneToken) {
                nodes.push({
                  nodeType: 'embedded-asset-block',
                  content: [],
                  data: { target: { sys: { type: 'Link', linkType: 'Asset', id: assetId } } },
                });
              } else {
                const LINK_TEXT = altText || 'image';
                nodes.push({
                  nodeType: 'asset-hyperlink',
                  data: { target: { sys: { type: 'Link', linkType: 'Asset', id: assetId } } },
                  content: [createTextNode(LINK_TEXT, [])],
                });
              }
            } else {
              nodes.push(createTextNode(line.slice(i, urlEnd + 1), []));
            }
            i = urlEnd + 1;
            continue;
          }
        }
      }
      if (line.startsWith('<u>', i)) {
        flush();
        underline = true;
        i += 3;
        continue;
      }
      if (line.startsWith('</u>', i)) {
        flush();
        underline = false;
        i += 4;
        continue;
      }
      if (line.startsWith('<B>', i)) {
        flush();
        bold = true;
        i += 3;
        continue;
      }
      if (line.startsWith('</B>', i)) {
        flush();
        bold = false;
        i += 4;
        continue;
      }
      if (line.startsWith('<I>', i)) {
        flush();
        italic = true;
        i += 3;
        continue;
      }
      if (line.startsWith('</I>', i)) {
        flush();
        italic = false;
        i += 4;
        continue;
      }
      if (line.startsWith('<U>', i)) {
        flush();
        underline = true;
        i += 3;
        continue;
      }
      if (line.startsWith('</U>', i)) {
        flush();
        underline = false;
        i += 4;
        continue;
      }

      // Toggle underline on '_' (single only, not '__') - markdown fallback
      if (line[i] === '_' && !(i + 1 < line.length && line[i + 1] === '_')) {
        flush();
        underline = !underline;
        i += 1;
        continue;
      }
      buffer += line[i];
      i += 1;
    }
    flush();
    return nodes;
  }
  parseDocument(normalized: string) {
    const lines = normalized.split(/\r?\n/);
    const documentChildren: any[] = [];
    for (let li = 0; li < lines.length; li++) {
      const rawLine = lines[li];
      if (!rawLine.trim()) {
        continue;
      }
      if (rawLine.trim().startsWith('```')) {
        const codeLines: string[] = [];
        li += 1;
        while (li < lines.length && !lines[li].trim().startsWith('```')) {
          codeLines.push(lines[li]);
          li += 1;
        }
        const codeText = codeLines.join('\n');
        documentChildren.push({
          nodeType: 'paragraph',
          data: {},
          content: [{ nodeType: 'text', value: codeText, marks: [{ type: 'code' }], data: {} }],
        });
        continue;
      }
      if (rawLine.trim().startsWith('<CODE>')) {
        const trimmed = rawLine.trim();
        const sameLineCloseIdx = trimmed.indexOf('</CODE>');
        if (sameLineCloseIdx !== -1) {
          const inner = trimmed.slice(6, sameLineCloseIdx);
          documentChildren.push({
            nodeType: 'paragraph',
            data: {},
            content: [{ nodeType: 'text', value: inner, marks: [{ type: 'code' }], data: {} }],
          });
          continue;
        }
        const codeLines: string[] = [rawLine.replace(/^\s*<CODE>/, '')];
        while (li + 1 < lines.length) {
          if (lines[li + 1].includes('</CODE>')) {
            li += 1;
            codeLines.push(lines[li].replace('</CODE>', ''));
            break;
          }
          li += 1;
          codeLines.push(lines[li]);
        }
        const codeText = codeLines.join('\n');
        documentChildren.push({
          nodeType: 'paragraph',
          data: {},
          content: [{ nodeType: 'text', value: codeText, marks: [{ type: 'code' }], data: {} }],
        });
        continue;
      }
      if (
        rawLine.trim() === '<HR/>' ||
        /^(\*\s*\*\s*\*\s*|-{3,}\s*|_{3,}\s*)$/.test(rawLine.trim())
      ) {
        documentChildren.push({ nodeType: 'hr', data: {}, content: [] });
        continue;
      }
      if (rawLine.trim().startsWith('>')) {
        const quoteText = rawLine.replace(/^>\s?/, '');
        const nodes = this.parseSimpleInline(quoteText);
        documentChildren.push({
          nodeType: 'blockquote',
          data: {},
          content: [createParagraph(nodes.length ? nodes : [createTextNode('', [])])],
        });
        continue;
      }
      const headingMatch = rawLine.match(/^\s*(#{1,6})\s+(.*)$/);
      const boldOnlyMatch = headingMatch
        ? null
        : rawLine.match(/^\s*(\*\*|__)\s*([\s\S]*?)\s*\1\s*$/);
      const isHeading = Boolean(headingMatch || boldOnlyMatch);
      const headingLevel = headingMatch
        ? (headingMatch[1].length as number)
        : boldOnlyMatch
        ? 2
        : 0;
      const line = headingMatch ? headingMatch[2] : boldOnlyMatch ? boldOnlyMatch[2] : rawLine;
      const nodes = this.parseInline(line);
      if (nodes.length) {
        if (isHeading) {
          documentChildren.push(createHeading(headingLevel, nodes));
        } else {
          documentChildren.push(createParagraph(nodes));
        }
      }
    }
    return documentChildren;
  }
  parse(markdown: string) {
    const normalized = this.normalizeInput(markdown);
    return this.parseDocument(normalized);
  }
}

// Removed legacy markdownToRichText in favor of MarkdownParser. Use:
// const parser = new MarkdownParser(urlToAssetId); parser.parse(markdown);
