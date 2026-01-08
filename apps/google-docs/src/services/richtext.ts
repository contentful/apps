import { richTextFromMarkdown } from '@contentful/rich-text-from-markdown';

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

// Class-based parser using @contentful/rich-text-from-markdown library
// Handles custom HTML tags and asset hyperlink mapping
export class MarkdownParser {
  private urlToAssetId?: Record<string, string>;

  constructor(urlToAssetId?: Record<string, string>) {
    this.urlToAssetId = urlToAssetId;
  }

  /**
   * Gets asset ID for an image URL
   */
  private getAssetId(url: string, altText: string): string | null {
    const normalizedUrl = url.replace(/\s+/g, '');
    const compositeKey = `${normalizedUrl}::${altText || 'image'}`;
    const drawingKey = altText.toLowerCase().includes('drawing')
      ? `${normalizedUrl}::drawing`
      : null;

    return (
      this.urlToAssetId?.[compositeKey] ||
      (drawingKey ? this.urlToAssetId?.[drawingKey] : null) ||
      this.urlToAssetId?.[normalizedUrl] ||
      null
    );
  }

  /**
   * Post-processes nodes to add underline marks from HTML <u> tags
   * The markdown library doesn't parse HTML, so we need to handle <u> tags manually
   */
  private addUnderlineMarks(nodes: any[]): any[] {
    const result: any[] = [];

    for (const node of nodes) {
      if (node.nodeType === NODE_TYPES.TEXT && node.value) {
        const value = node.value as string;
        console.log('Processing text node:', { value, marks: node.marks });

        // Check if text contains <u> tags (both escaped and unescaped)
        if (
          value.includes('<u>') ||
          value.includes('</u>') ||
          value.includes('&lt;u&gt;') ||
          value.includes('&lt;/u&gt;')
        ) {
          console.log('Found <u> tags in text:', value);
          // Replace escaped HTML with actual tags for processing
          const normalizedValue = value
            .replace(/&lt;u&gt;/g, '<u>')
            .replace(/&lt;\/u&gt;/g, '</u>');
          const parts = normalizedValue.split(/(<u>|<\/u>)/);
          let underlineActive = false;
          let currentText = '';

          for (const part of parts) {
            if (part === '<u>') {
              if (currentText) {
                result.push({
                  ...node,
                  value: currentText,
                });
                currentText = '';
              }
              underlineActive = true;
            } else if (part === '</u>') {
              if (currentText) {
                const marks = node.marks || [];
                const underlineMarks = underlineActive
                  ? [...marks.filter((m: any) => m.type !== 'underline'), { type: 'underline' }]
                  : [...marks];
                console.log('Adding underline mark:', { currentText, marks: underlineMarks });
                result.push({
                  ...node,
                  value: currentText,
                  marks: underlineMarks,
                });
                currentText = '';
              }
              underlineActive = false;
            } else if (part && part !== '<u>' && part !== '</u>') {
              currentText += part;
            }
          }

          if (currentText) {
            const marks = node.marks || [];
            const underlineMarks = underlineActive
              ? [...marks.filter((m: any) => m.type !== 'underline'), { type: 'underline' }]
              : [...marks];
            console.log('Final text chunk:', { currentText, marks: underlineMarks });
            result.push({
              ...node,
              value: currentText,
              marks: underlineMarks,
            });
          }
        } else {
          result.push(node);
        }
      } else if (node.content && Array.isArray(node.content)) {
        result.push({
          ...node,
          content: this.addUnderlineMarks(node.content),
        });
      } else {
        result.push(node);
      }
    }

    return result;
  }

  /**
   * Pre-processes markdown to convert <u> tags to markers that survive markdown parsing
   * Uses a unique text pattern that won't be parsed as markdown
   */
  private preprocessMarkdown(markdown: string): string {
    // Use a unique marker pattern that looks like text but is identifiable
    // Format: [UNDERLINE_START]text[UNDERLINE_END] - using brackets that won't conflict with markdown links
    const UNDERLINE_START = '[UNDERLINE_START]';
    const UNDERLINE_END = '[UNDERLINE_END]';

    // Replace <u>text</u> with markers, handling nested cases
    const processed = markdown.replace(
      /<u>([^<]*(?:<[^u/][^>]*>[^<]*<\/[^u][^>]*>[^<]*)*)<\/u>/g,
      (match, text) => {
        return `${UNDERLINE_START}${text}${UNDERLINE_END}`;
      }
    );

    // Also handle simple case
    const processed2 = processed.replace(/<u>([^<]*)<\/u>/g, (match, text) => {
      return `${UNDERLINE_START}${text}${UNDERLINE_END}`;
    });

    return processed2;
  }

  /**
   * Post-processes nodes to add underline marks from text markers
   */
  private addUnderlineMarksFromMarkers(nodes: any[]): any[] {
    const result: any[] = [];
    const UNDERLINE_START = '[UNDERLINE_START]';
    const UNDERLINE_END = '[UNDERLINE_END]';

    for (const node of nodes) {
      if (node.nodeType === NODE_TYPES.TEXT && node.value) {
        const value = node.value as string;

        // Check for underline markers
        if (value.includes(UNDERLINE_START) || value.includes(UNDERLINE_END)) {
          // Split by markers - use simple string split instead of regex to avoid escaping issues
          const parts: string[] = [];
          let remaining = value;
          let lastIndex = 0;

          while (remaining.length > 0) {
            const startIndex = remaining.indexOf(UNDERLINE_START);
            const endIndex = remaining.indexOf(UNDERLINE_END);

            if (startIndex === -1 && endIndex === -1) {
              // No more markers, add remaining text
              if (remaining.length > 0) {
                parts.push(remaining);
              }
              break;
            }

            // Find which marker comes first
            let nextMarker: 'start' | 'end' | null = null;
            let nextIndex = -1;

            if (startIndex !== -1 && (endIndex === -1 || startIndex < endIndex)) {
              nextMarker = 'start';
              nextIndex = startIndex;
            } else if (endIndex !== -1) {
              nextMarker = 'end';
              nextIndex = endIndex;
            }

            if (nextIndex > 0) {
              // Add text before marker
              parts.push(remaining.substring(0, nextIndex));
            }

            // Add marker itself
            parts.push(nextMarker === 'start' ? UNDERLINE_START : UNDERLINE_END);

            // Update remaining
            const markerLength =
              nextMarker === 'start' ? UNDERLINE_START.length : UNDERLINE_END.length;
            remaining = remaining.substring(nextIndex + markerLength);
          }
          let underlineActive = false;
          let currentText = '';

          for (const part of parts) {
            if (part === UNDERLINE_START) {
              if (currentText) {
                result.push({
                  ...node,
                  value: currentText,
                });
                currentText = '';
              }
              underlineActive = true;
            } else if (part === UNDERLINE_END) {
              if (currentText) {
                const marks = node.marks || [];
                const underlineMarks = underlineActive
                  ? [...marks.filter((m: any) => m.type !== 'underline'), { type: 'underline' }]
                  : [...marks];
                result.push({
                  ...node,
                  value: currentText,
                  marks: underlineMarks,
                });
                currentText = '';
              }
              underlineActive = false;
            } else if (part && part !== UNDERLINE_START && part !== UNDERLINE_END) {
              currentText += part;
            }
          }

          if (currentText) {
            const marks = node.marks || [];
            const underlineMarks = underlineActive
              ? [...marks.filter((m: any) => m.type !== 'underline'), { type: 'underline' }]
              : [...marks];
            result.push({
              ...node,
              value: currentText,
              marks: underlineMarks,
            });
          }
        } else {
          result.push(node);
        }
      } else if (node.content && Array.isArray(node.content)) {
        result.push({
          ...node,
          content: this.addUnderlineMarksFromMarkers(node.content),
        });
      } else {
        result.push(node);
      }
    }

    return result;
  }

  /**
   * Parses a document using @contentful/rich-text-from-markdown
   */
  async parseDocument(markdown: string): Promise<any[]> {
    try {
      const preprocessedMarkdown = this.preprocessMarkdown(markdown);

      const richTextDocument = await richTextFromMarkdown(preprocessedMarkdown, (node) => {
        // Handle images with asset mapping
        if (node.type === 'image') {
          const url = (node as any).url?.trim() || (node as any).href?.trim() || '';
          const altText = (node as any).alt || (node as any).title || '';
          const assetId = this.getAssetId(url, altText);

          if (assetId) {
            return Promise.resolve({
              nodeType: NODE_TYPES.EMBEDDED_ASSET_BLOCK,
              content: [],
              data: {
                target: {
                  sys: {
                    type: 'Link',
                    linkType: 'Asset',
                    id: assetId,
                  },
                },
              },
            });
          } else {
            console.warn(
              `✗ No asset ID found for image URL: ${url.substring(0, 100)}... (alt: "${altText}")`
            );
            return Promise.resolve(null);
          }
        }

        return Promise.resolve(null);
      });

      // Add underline marks from markers (markdown library strips HTML)
      const processedContent = this.addUnderlineMarksFromMarkers(richTextDocument.content || []);
      return processedContent;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return [];
    }
  }

  async parse(markdown: string): Promise<any[]> {
    return await this.parseDocument(markdown);
  }
}
