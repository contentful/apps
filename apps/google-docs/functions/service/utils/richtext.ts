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

export function markdownToRichText(markdown: string) {
  // Normalize simple HTML tags to markdown-like markers we support
  // Bold: <strong> or <b> -> **
  // Italic: <em> or <i> -> *
  // Underline: <u> -> _
  let normalized = markdown;
  try {
    normalized = normalized
      .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
      .replace(/<u>([\s\S]*?)<\/u>/gi, '_$1_');
  } catch {
    // If any regex fails, fall back to original string
    normalized = markdown;
  }

  // Basic Markdown to Contentful Rich Text for bold (**text**) and italics (*text*)
  // Splits into paragraphs by newlines
  const lines = normalized.split(/\r?\n/);
  const documentChildren: any[] = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      continue;
    }

    const nodes: any[] = [];
    let buffer = '';
    let i = 0;
    let bold = false;
    let italic = false;
    let underline = false;

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
      // Toggle bold on '**'
      if (line.startsWith('**', i)) {
        flushBuffer();
        bold = !bold;
        i += 2;
        continue;
      }
      // Toggle italic on '*'
      if (line[i] === '*') {
        // Avoid treating '**' case here
        if (!(i + 1 < line.length && line[i + 1] === '*')) {
          flushBuffer();
          italic = !italic;
          i += 1;
          continue;
        }
      }
      // Toggle underline on '__' or single '_'
      if (line.startsWith('__', i)) {
        flushBuffer();
        underline = !underline;
        i += 2;
        continue;
      }
      if (line[i] === '_') {
        // Avoid treating '__' case here
        if (!(i + 1 < line.length && line[i + 1] === '_')) {
          flushBuffer();
          underline = !underline;
          i += 1;
          continue;
        }
      }
      buffer += line[i];
      i += 1;
    }
    flushBuffer();

    if (nodes.length === 0) {
      nodes.push(createTextNode('', []));
    }

    if (isHeading) {
      documentChildren.push(createHeading(headingLevel, nodes));
    } else {
      documentChildren.push(createParagraph(nodes));
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
