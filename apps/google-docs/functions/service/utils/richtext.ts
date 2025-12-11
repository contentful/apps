export enum NODE_TYPES {
  TEXT = 'text',
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  HYPERLINK = 'hyperlink',
  HR = 'hr',
  BLOCKQUOTE = 'blockquote',
  ASSET_HYPERLINK = 'asset-hyperlink',
  EMBEDDED_ASSET_BLOCK = 'embedded-asset-block',
}

function createTextNode(value: string, marks: Array<{ type: 'bold' | 'italic' | 'underline' }>) {
  return {
    nodeType: NODE_TYPES.TEXT,
    value,
    marks,
    data: {},
  };
}

function createParagraph(children: any[]) {
  return {
    nodeType: NODE_TYPES.PARAGRAPH,
    data: {},
    content: children,
  };
}

function createHeading(level: number, children: any[]) {
  const clamped = Math.min(6, Math.max(1, level));
  return {
    nodeType: `${NODE_TYPES.HEADING}-${clamped}`,
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
              nodeType: NODE_TYPES.HYPERLINK,
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
          nodes.push({ nodeType: NODE_TYPES.TEXT, value: codeText, marks, data: {} });
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
              nodeType: NODE_TYPES.HYPERLINK,
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
            // Normalize URL the same way as in entryService.ts (remove all whitespace)
            // This ensures we can find the asset ID even if the URL has whitespace differences
            const normalizedUrl = url.replace(/\s+/g, '');
            flush();

            // Try to find asset ID using composite key (URL + alt) first, then fall back to URL only
            // This handles cases where same URL appears with different alt text (e.g., drawing vs image)
            const compositeKey = `${normalizedUrl}::${altText || 'image'}`;
            const drawingKey = altText.toLowerCase().includes('drawing')
              ? `${normalizedUrl}::drawing`
              : null;
            let assetId =
              this.urlToAssetId?.[compositeKey] ||
              (drawingKey ? this.urlToAssetId?.[drawingKey] : null) ||
              this.urlToAssetId?.[normalizedUrl];

            if (assetId) {
              // Always use asset-hyperlink for inline images (never embedded-asset-block in inline context)
              // Standalone images are handled at the parseDocument level
              const LINK_TEXT = altText || 'image';
              console.log(
                `✓ Mapped image URL to asset: ${normalizedUrl.substring(
                  0,
                  100
                )}... -> ${assetId} (alt: "${altText}")`
              );
              nodes.push({
                nodeType: NODE_TYPES.ASSET_HYPERLINK,
                data: { target: { sys: { type: 'Link', linkType: 'Asset', id: assetId } } },
                content: [createTextNode(LINK_TEXT, [])],
              });
            } else {
              // Log when we can't find an asset ID for a URL (helps debug mapping issues)
              console.warn(
                `✗ No asset ID found for image URL: ${normalizedUrl.substring(
                  0,
                  100
                )}... (alt: "${altText}")`
              );
              console.warn(
                `  Tried keys: "${compositeKey.substring(0, 80)}...", "${normalizedUrl.substring(
                  0,
                  80
                )}..."`
              );
              console.warn(
                `  Available URL keys in map: ${Object.keys(this.urlToAssetId || {})
                  .slice(0, 5)
                  .map((k) => k.substring(0, 50))
                  .join(', ')}${Object.keys(this.urlToAssetId || {}).length > 5 ? '...' : ''}`
              );
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
          nodeType: NODE_TYPES.PARAGRAPH,
          data: {},
          content: [
            { nodeType: NODE_TYPES.TEXT, value: codeText, marks: [{ type: 'code' }], data: {} },
          ],
        });
        continue;
      }
      if (rawLine.trim().startsWith('<CODE>')) {
        const trimmed = rawLine.trim();
        const sameLineCloseIdx = trimmed.indexOf('</CODE>');
        if (sameLineCloseIdx !== -1) {
          const inner = trimmed.slice(6, sameLineCloseIdx);
          documentChildren.push({
            nodeType: NODE_TYPES.PARAGRAPH,
            data: {},
            content: [
              { nodeType: NODE_TYPES.TEXT, value: inner, marks: [{ type: 'code' }], data: {} },
            ],
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
          nodeType: NODE_TYPES.PARAGRAPH,
          data: {},
          content: [
            { nodeType: NODE_TYPES.TEXT, value: codeText, marks: [{ type: 'code' }], data: {} },
          ],
        });
        continue;
      }
      if (
        rawLine.trim() === '<HR/>' ||
        /^(\*\s*\*\s*\*\s*|-{3,}\s*|_{3,}\s*)$/.test(rawLine.trim())
      ) {
        documentChildren.push({ nodeType: NODE_TYPES.HR, data: {}, content: [] });
        continue;
      }
      if (rawLine.trim().startsWith('>')) {
        const quoteText = rawLine.replace(/^>\s?/, '');
        const nodes = this.parseSimpleInline(quoteText);
        documentChildren.push({
          nodeType: NODE_TYPES.BLOCKQUOTE,
          data: {},
          content: [createParagraph(nodes.length ? nodes : [createTextNode('', [])])],
        });
        continue;
      }

      // Check for standalone image token BEFORE parsing inline
      // A standalone image is a line that contains ONLY an image token (with optional whitespace)
      const imageMatch = rawLine.match(/^\s*!\[([^\]]*?)\]\(([\s\S]*?)\)\s*$/);
      if (imageMatch) {
        const url = imageMatch[2].trim();
        const altText = imageMatch[1] || '';
        // Normalize URL the same way as in entryService.ts (remove all whitespace)
        // This ensures we can find the asset ID even if the URL has whitespace differences
        const normalizedUrl = url.replace(/\s+/g, '');

        // Try to find asset ID using composite key (URL + alt) first, then fall back to URL only
        // This handles cases where same URL appears with different alt text (e.g., drawing vs image)
        const compositeKey = `${normalizedUrl}::${altText || 'image'}`;
        const drawingKey = altText.toLowerCase().includes('drawing')
          ? `${normalizedUrl}::drawing`
          : null;
        let assetId =
          this.urlToAssetId?.[compositeKey] ||
          (drawingKey ? this.urlToAssetId?.[drawingKey] : null) ||
          this.urlToAssetId?.[normalizedUrl];

        if (assetId) {
          // Standalone image -> add as block-level embedded asset (direct child of document)
          console.log(
            `✓ Mapped standalone image URL to asset: ${normalizedUrl.substring(
              0,
              100
            )}... -> ${assetId} (alt: "${altText}")`
          );
          documentChildren.push({
            nodeType: NODE_TYPES.EMBEDDED_ASSET_BLOCK,
            content: [],
            data: { target: { sys: { type: 'Link', linkType: 'Asset', id: assetId } } },
          });
          continue;
        } else {
          // Log when we can't find an asset ID for a standalone image URL (helps debug mapping issues)
          console.warn(
            `✗ No asset ID found for standalone image URL: ${normalizedUrl.substring(
              0,
              100
            )}... (alt: "${altText}")`
          );
          console.warn(
            `  Tried keys: "${compositeKey.substring(0, 80)}...", "${normalizedUrl.substring(
              0,
              80
            )}..."`
          );
          console.warn(
            `  Available URL keys in map: ${Object.keys(this.urlToAssetId || {})
              .slice(0, 5)
              .map((k) => k.substring(0, 50))
              .join(', ')}${Object.keys(this.urlToAssetId || {}).length > 5 ? '...' : ''}`
          );
        }
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

      // Ensure no embedded-asset-block nodes end up in paragraphs (defensive check)
      const inlineNodes: any[] = [];
      const blockNodes: any[] = [];

      for (const node of nodes) {
        if (node.nodeType === NODE_TYPES.EMBEDDED_ASSET_BLOCK) {
          blockNodes.push(node);
        } else {
          inlineNodes.push(node);
        }
      }

      if (inlineNodes.length) {
        if (isHeading) {
          documentChildren.push(createHeading(headingLevel, inlineNodes));
        } else {
          documentChildren.push(createParagraph(inlineNodes));
        }
      }

      // If any embedded-asset-block nodes were created (shouldn't happen, but handle gracefully)
      for (const blockNode of blockNodes) {
        documentChildren.push(blockNode);
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
