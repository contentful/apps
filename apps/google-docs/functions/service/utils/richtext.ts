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

export function markdownToRichText(markdown: string, urlToAssetId?: Record<string, string>) {
  // Normalize simple HTML tags to markdown-like markers we support
  // Bold: <strong> or <b> -> **
  // Italic: <em> or <i> -> *
  // Underline: <u> -> _
  let normalized = markdown;
  try {
    // Normalize nested combinations first so we get contiguous markers
    normalized = normalized
      // <strong><em>text</em></strong> or <b><i>...</i></b> -> ***text***
      .replace(/<(strong|b)>\s*<(em|i)>([\s\S]*?)<\/\2>\s*<\/\1>/gi, '***$3***')
      // <em><strong>text</strong></em> or <i><b>...</b></i> -> ***text***
      .replace(/<(em|i)>\s*<(strong|b)>([\s\S]*?)<\/\2>\s*<\/\1>/gi, '***$3***')
      // Now handle single tags
      .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');
    // Collapse newlines and spaces inside markdown image/link tokens so parsing works line-by-line
    normalized = normalized.replace(/!\[([^\]]*?)\]\(([\s\S]*?)\)/g, (_m, alt, url) => {
      const cleanUrl = String(url).replace(/\s+/g, '');
      return `![${alt}](${cleanUrl})`;
    });
    normalized = normalized.replace(/\[([^\]]*?)\]\(([\s\S]*?)\)/g, (_m, text, url) => {
      const cleanUrl = String(url).replace(/\s+/g, '');
      return `[${text}](${cleanUrl})`;
    });
  } catch {
    // If any regex fails, fall back to original string
    normalized = markdown;
  }

  // Basic Markdown to Contentful Rich Text for bold (**text**) and italics (*text*)
  // Splits into paragraphs by newlines
  const lines = normalized.split(/\r?\n/);
  const documentChildren: any[] = [];

  for (let li = 0; li < lines.length; li++) {
    const rawLine = lines[li];
    if (!rawLine.trim()) {
      continue;
    }

    const nodes: any[] = [];
    let buffer = '';
    let i = 0;
    let bold = false;
    let italic = false;
    let underline = false;

    // Detect fenced code block ```
    if (rawLine.trim().startsWith('```')) {
      const codeLines: string[] = [];
      li += 1;
      while (li < lines.length && !lines[li].trim().startsWith('```')) {
        codeLines.push(lines[li]);
        li += 1;
      }
      // li now points at closing ``` or end; loop will ++ at end
      const codeText = codeLines.join('\n');
      // Use paragraph with code-marked text for compatibility when code-block is not allowed
      documentChildren.push({
        nodeType: 'paragraph',
        data: {},
        content: [
          {
            nodeType: 'text',
            value: codeText,
            marks: [{ type: 'code' }],
            data: {},
          },
        ],
      });
      continue;
    }

    // Detect horizontal rule
    if (/^(\*\s*\*\s*\*\s*|-{3,}\s*|_{3,}\s*)$/.test(rawLine.trim())) {
      documentChildren.push({ nodeType: 'hr', data: {}, content: [] });
      continue;
    }

    // Detect blockquote line
    if (rawLine.trim().startsWith('>')) {
      const quoteText = rawLine.replace(/^>\s?/, '');
      // reuse inline parsing by setting line = quoteText
      const line = quoteText;
      // Detect Markdown heading inside blockquote not supported; treat as paragraph
      // parse inline marks below (duplicated logic)
      // Reset scanner vars for this line
      i = 0;
      bold = false;
      italic = false;
      underline = false;
      const flushBufferBQ = () => {
        if (buffer.length === 0) return;
        const marks: Array<{ type: 'bold' | 'italic' | 'underline' }> = [];
        if (bold) marks.push({ type: 'bold' });
        if (italic) marks.push({ type: 'italic' });
        if (underline) marks.push({ type: 'underline' });
        nodes.push(createTextNode(buffer, marks));
        buffer = '';
      };
      while (i < line.length) {
        // simple inline parsing (bold/italic/underline)
        if (line.startsWith('**', i)) {
          flushBufferBQ();
          bold = !bold;
          i += 2;
          continue;
        }
        if (line[i] === '*') {
          if (!(i + 1 < line.length && line[i + 1] === '*')) {
            flushBufferBQ();
            italic = !italic;
            i += 1;
            continue;
          }
        }
        if (line.startsWith('__', i)) {
          flushBufferBQ();
          underline = !underline;
          i += 2;
          continue;
        }
        if (line[i] === '_') {
          if (!(i + 1 < line.length && line[i + 1] === '_')) {
            flushBufferBQ();
            underline = !underline;
            i += 1;
            continue;
          }
        }
        buffer += line[i];
        i += 1;
      }
      flushBufferBQ();
      documentChildren.push({
        nodeType: 'blockquote',
        data: {},
        content: [createParagraph(nodes.length ? nodes : [createTextNode('', [])])],
      });
      continue;
    }

    // Detect Markdown heading at start of line
    const headingMatch = rawLine.match(/^\s*(#{1,6})\s+(.*)$/);
    // Heuristic: treat lines that are entirely bold as H2 (e.g., **Heading**)
    const boldOnlyMatch = headingMatch
      ? null
      : rawLine.match(/^\s*(\*\*|__)\s*([\s\S]*?)\s*\1\s*$/);
    const isHeading = Boolean(headingMatch || boldOnlyMatch);
    const headingLevel = headingMatch ? (headingMatch[1].length as number) : boldOnlyMatch ? 2 : 0;
    const line = headingMatch ? headingMatch[2] : boldOnlyMatch ? boldOnlyMatch[2] : rawLine;

    const flushBuffer = () => {
      if (buffer.length === 0) return;
      const marks: Array<{ type: 'bold' | 'italic' | 'underline' }> = [];
      if (bold) marks.push({ type: 'bold' });
      if (italic) marks.push({ type: 'italic' });
      if (underline) marks.push({ type: 'underline' });
      nodes.push(createTextNode(buffer, marks));
      buffer = '';
    };

    while (i < line.length) {
      // Parse hyperlink: [text](url)
      if (line[i] === '[') {
        const textStart = i + 1;
        const textEnd = line.indexOf(']', textStart);
        if (textEnd !== -1 && textEnd + 1 < line.length && line[textEnd + 1] === '(') {
          const urlStart = textEnd + 2;
          const urlEnd = line.indexOf(')', urlStart);
          if (urlEnd !== -1) {
            const linkText = line.slice(textStart, textEnd);
            const url = line.slice(urlStart, urlEnd).trim();
            flushBuffer();
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
      // Parse image syntax: ![alt](url)
      if (line[i] === '!' && i + 1 < line.length && line[i + 1] === '[') {
        // Find closing ']' and then '(' and ')'
        const altStart = i + 2;
        const altEnd = line.indexOf(']', altStart);
        if (altEnd !== -1 && altEnd + 1 < line.length && line[altEnd + 1] === '(') {
          const urlStart = altEnd + 2;
          const urlEnd = line.indexOf(')', urlStart);
          if (urlEnd !== -1) {
            const altText = line.slice(altStart, altEnd);
            const url = line.slice(urlStart, urlEnd).trim();
            // Flush current buffered text to keep styles coherent up to the image
            flushBuffer();
            const assetId = urlToAssetId?.[url];
            if (assetId) {
              const tokenText = line.slice(i, urlEnd + 1);
              const isStandaloneToken = nodes.length === 0 && tokenText.trim() === line.trim();
              if (isStandaloneToken) {
                // Standalone image line -> insert as block embedded asset
                documentChildren.push({
                  nodeType: 'embedded-asset-block',
                  content: [],
                  data: {
                    target: {
                      sys: { type: 'Link', linkType: 'Asset', id: assetId },
                    },
                  },
                });
              } else {
                // Inline in a paragraph -> keep it inline as a visible asset hyperlink
                const LINK_TEXT = altText || 'image';
                nodes.push({
                  nodeType: 'asset-hyperlink',
                  data: {
                    target: {
                      sys: { type: 'Link', linkType: 'Asset', id: assetId },
                    },
                  },
                  content: [createTextNode(LINK_TEXT, [])],
                });
              }
            } else {
              // Fallback: keep literal markdown if no asset id
              nodes.push(createTextNode(line.slice(i, urlEnd + 1), []));
            }
            i = urlEnd + 1;
            continue;
          }
        }
      }
      // Toggle underline via HTML tags <u>...</u>
      if (line.startsWith('<u>', i)) {
        flushBuffer();
        underline = true;
        i += 3;
        continue;
      }
      if (line.startsWith('</u>', i)) {
        flushBuffer();
        underline = false;
        i += 4;
        continue;
      }

      // Toggle bold+italic when encountering triple asterisks '***'
      if (line.startsWith('***', i)) {
        flushBuffer();
        // flip both together
        bold = !bold;
        italic = !italic;
        i += 3;
        continue;
      }

      // Toggle bold on '**'
      if (line.startsWith('**', i)) {
        flushBuffer();
        bold = !bold;
        i += 2;
        continue;
      }
      // Toggle italic on '*' (single only, not '**')
      if (line[i] === '*') {
        // Avoid treating '**' case here
        if (!(i + 1 < line.length && line[i + 1] === '*')) {
          flushBuffer();
          italic = !italic;
          i += 1;
          continue;
        }
      }
      // Toggle underline on '_' (single only, not '__')
      if (line[i] === '_' && !(i + 1 < line.length && line[i + 1] === '_')) {
        flushBuffer();
        underline = !underline;
        i += 1;
        continue;
      }
      buffer += line[i];
      i += 1;
    }
    flushBuffer();

    if (nodes.length) {
      if (isHeading) {
        documentChildren.push(createHeading(headingLevel, nodes));
      } else {
        documentChildren.push(createParagraph(nodes));
      }
    }
  }

  return {
    nodeType: 'document',
    data: {},
    content: documentChildren.length
      ? documentChildren
      : [createParagraph([createTextNode('', [])])],
  };
}
