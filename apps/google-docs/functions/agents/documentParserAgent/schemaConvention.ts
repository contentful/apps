/**
 * Schema Convention Parser
 *
 * Parses schema markers from Google Docs to help AI extract structured content.
 *
 * Schema Convention Format:
 * - Entry markers: **!CT:contentTypeId!** (marks the start of an entry)
 * - Reference markers: **!REF:tempId!** (marks a reference to another entry)
 * - Entry end markers: **!END!** (optional, marks end of entry)
 *
 * Examples:
 * - **!CT:blogPost!** marks the start of a blog post entry
 * - **!REF:author_1!** marks a reference to an author entry with tempId "author_1"
 * - **!END!** marks the end of the current entry
 */

export interface SchemaMarker {
  type: 'entry' | 'reference' | 'end';
  value: string; // contentTypeId for entry, tempId for reference
  position: number; // Character position in document
  line?: number; // Optional line number
}

export interface ParsedSchema {
  markers: SchemaMarker[];
  hasSchema: boolean;
  entryBoundaries: Map<number, { contentTypeId: string; start: number; end?: number }>;
  references: Map<number, string>; // position -> tempId
}

/**
 * Regular expressions for schema markers
 * Using **!...!** format as it's highly unlikely to appear in normal documents
 */
const ENTRY_MARKER_REGEX = /\*\*!CT:([a-zA-Z0-9_-]+)!\*\*/g;
const REFERENCE_MARKER_REGEX = /\*\*!REF:([a-zA-Z0-9_-]+)!\*\*/g;
const END_MARKER_REGEX = /\*\*!END!\*\*/g;

/**
 * Alternative simpler formats (for testing):
 * - [[CT:contentTypeId]] - simple brackets
 * - {{CT:contentTypeId}} - double braces
 * - [CF:CT:contentTypeId] - Contentful prefix
 */
const ALTERNATIVE_ENTRY_REGEXES = [
  /\[\[CT:([a-zA-Z0-9_-]+)\]\]/g,
  /\{\{CT:([a-zA-Z0-9_-]+)\}\}/g,
  /\[CF:CT:([a-zA-Z0-9_-]+)\]/g,
];

const ALTERNATIVE_REF_REGEXES = [
  /\[\[REF:([a-zA-Z0-9_-]+)\]\]/g,
  /\{\{REF:([a-zA-Z0-9_-]+)\}\}/g,
  /\[CF:REF:([a-zA-Z0-9_-]+)\]/g,
];

/**
 * Parses schema markers from document text
 * Supports multiple marker formats for testing
 */
export function parseSchemaMarkers(documentText: string): ParsedSchema {
  const markers: SchemaMarker[] = [];
  let position = 0;

  // Parse primary format: **!CT:...!** and **!REF:...!**
  let match;

  // Entry markers
  while ((match = ENTRY_MARKER_REGEX.exec(documentText)) !== null) {
    markers.push({
      type: 'entry',
      value: match[1],
      position: match.index,
    });
  }
  ENTRY_MARKER_REGEX.lastIndex = 0; // Reset regex

  // Reference markers
  while ((match = REFERENCE_MARKER_REGEX.exec(documentText)) !== null) {
    markers.push({
      type: 'reference',
      value: match[1],
      position: match.index,
    });
  }
  REFERENCE_MARKER_REGEX.lastIndex = 0; // Reset regex

  // End markers
  while ((match = END_MARKER_REGEX.exec(documentText)) !== null) {
    markers.push({
      type: 'end',
      value: '',
      position: match.index,
    });
  }
  END_MARKER_REGEX.lastIndex = 0; // Reset regex

  // Parse alternative formats
  for (const regex of ALTERNATIVE_ENTRY_REGEXES) {
    while ((match = regex.exec(documentText)) !== null) {
      markers.push({
        type: 'entry',
        value: match[1],
        position: match.index,
      });
    }
    regex.lastIndex = 0;
  }

  for (const regex of ALTERNATIVE_REF_REGEXES) {
    while ((match = regex.exec(documentText)) !== null) {
      markers.push({
        type: 'reference',
        value: match[1],
        position: match.index,
      });
    }
    regex.lastIndex = 0;
  }

  // Sort markers by position
  markers.sort((a, b) => a.position - b.position);

  // Build entry boundaries map
  const entryBoundaries = new Map<number, { contentTypeId: string; start: number; end?: number }>();
  const references = new Map<number, string>();

  let currentEntryStart: { contentTypeId: string; start: number } | null = null;
  let entryIndex = 0;

  for (const marker of markers) {
    if (marker.type === 'entry') {
      // Close previous entry if exists
      if (currentEntryStart) {
        entryBoundaries.set(entryIndex++, {
          ...currentEntryStart,
          end: marker.position,
        });
      }
      // Start new entry
      currentEntryStart = {
        contentTypeId: marker.value,
        start: marker.position,
      };
    } else if (marker.type === 'end' && currentEntryStart) {
      // Close current entry
      entryBoundaries.set(entryIndex++, {
        ...currentEntryStart,
        end: marker.position,
      });
      currentEntryStart = null;
    } else if (marker.type === 'reference') {
      references.set(marker.position, marker.value);
    }
  }

  // Close last entry if exists
  if (currentEntryStart) {
    entryBoundaries.set(entryIndex, {
      ...currentEntryStart,
    });
  }

  return {
    markers,
    hasSchema: markers.length > 0,
    entryBoundaries,
    references,
  };
}

/**
 * Removes schema markers from text (for clean extraction)
 */
export function removeSchemaMarkers(text: string): string {
  let cleaned = text;

  // Remove primary format markers
  cleaned = cleaned.replace(ENTRY_MARKER_REGEX, '');
  cleaned = cleaned.replace(REFERENCE_MARKER_REGEX, '');
  cleaned = cleaned.replace(END_MARKER_REGEX, '');

  // Remove alternative format markers
  for (const regex of ALTERNATIVE_ENTRY_REGEXES) {
    cleaned = cleaned.replace(regex, '');
  }
  for (const regex of ALTERNATIVE_REF_REGEXES) {
    cleaned = cleaned.replace(regex, '');
  }

  return cleaned;
}

/**
 * Extracts text content from Google Docs JSON and parses schema markers
 */
export function extractTextWithSchema(documentJson: unknown): {
  text: string;
  schema: ParsedSchema;
} {
  // Extract plain text from Google Docs JSON
  const text = extractPlainText(documentJson);

  // Parse schema markers
  const schema = parseSchemaMarkers(text);

  return { text, schema };
}

/**
 * Extracts plain text from Google Docs JSON structure
 * Recursively extracts text from paragraphs, tables, and other elements
 */
function extractPlainText(documentJson: unknown): string {
  if (typeof documentJson !== 'object' || documentJson === null) {
    return '';
  }

  const doc = documentJson as any;
  let text = '';

  // Navigate to body content
  const tabs = doc.tabs || [];
  if (tabs.length === 0) {
    return '';
  }

  const body = tabs[0]?.documentTab?.body?.content || [];

  for (const element of body) {
    if (element.paragraph) {
      text += extractTextFromParagraph(element.paragraph);
    } else if (element.table) {
      text += extractTextFromTable(element.table);
    } else if (element.sectionBreak) {
      text += '\n';
    }
  }

  return text;
}

function extractTextFromParagraph(paragraph: any): string {
  let text = '';
  const elements = paragraph.elements || [];

  for (const elem of elements) {
    if (elem.textRun?.content) {
      text += elem.textRun.content;
    } else if (elem.inlineObjectElement) {
      // Skip inline objects for text extraction (they're handled separately)
      text += ' ';
    }
  }

  return text;
}

function extractTextFromTable(table: any): string {
  let text = '';
  const rows = table.tableRows || [];

  for (const row of rows) {
    const cells = row.tableCells || [];
    for (const cell of cells) {
      const content = cell.content || [];
      for (const element of content) {
        if (element.paragraph) {
          text += extractTextFromParagraph(element.paragraph);
        }
      }
      text += '\t'; // Tab separator for table cells
    }
    text += '\n'; // New line for each row
  }

  return text;
}

/**
 * Generates schema guidance for AI prompt based on parsed schema
 */
export function generateSchemaGuidance(
  schema: ParsedSchema,
  availableContentTypes: string[]
): string {
  if (!schema.hasSchema) {
    return '';
  }

  let guidance = '\n=== SCHEMA CONVENTION DETECTED ===\n';
  guidance += 'The document contains explicit schema markers that you MUST respect.\n\n';

  if (schema.entryBoundaries.size > 0) {
    guidance += '**ENTRY BOUNDARIES:**\n';
    guidance += `Found ${schema.entryBoundaries.size} explicit entry marker(s):\n`;

    let index = 0;
    for (const [_, boundary] of schema.entryBoundaries) {
      index++;
      guidance += `  Entry ${index}: Content Type "${boundary.contentTypeId}" starts at position ${boundary.start}`;
      if (boundary.end) {
        guidance += `, ends at position ${boundary.end}\n`;
      } else {
        guidance += ` (no end marker found)\n`;
      }

      // Validate content type
      if (!availableContentTypes.includes(boundary.contentTypeId)) {
        guidance += `  ⚠️  WARNING: Content type "${boundary.contentTypeId}" is not in the available content types list.\n`;
        guidance += `     Available types: ${availableContentTypes.join(', ')}\n`;
      }
    }
    guidance += '\n';
  }

  if (schema.references.size > 0) {
    guidance += '**EXPLICIT REFERENCES:**\n';
    guidance += `Found ${schema.references.size} explicit reference marker(s):\n`;

    for (const [position, tempId] of schema.references) {
      guidance += `  Position ${position}: Reference to tempId "${tempId}"\n`;
    }
    guidance += '\n';
  }

  guidance += '**CRITICAL INSTRUCTIONS:**\n';
  guidance += '1. You MUST create entries exactly as marked by **!CT:...!** markers\n';
  guidance += '2. Each **!CT:contentTypeId!** marker indicates the start of a new entry\n';
  guidance += '3. Use **!REF:tempId!** markers to create references between entries\n';
  guidance += '4. If **!END!** markers are present, respect entry boundaries\n';
  guidance += '5. Extract content between markers for each entry\n';
  guidance += '6. Schema markers take precedence over inference - follow them exactly\n';
  guidance += '\n=== END SCHEMA CONVENTION ===\n';

  return guidance;
}
