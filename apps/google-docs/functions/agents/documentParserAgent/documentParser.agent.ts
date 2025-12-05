/**
 * Document Parser Agent
 *
 * Agent that takes a Google Doc URL and content type definitions,
 * then uses OpenAI to extract structured entries from the document
 * that can be directly created in Contentful.
 * See https://contentful.atlassian.net/wiki/spaces/ECO/pages/5850955777/RFC+Google+Docs+V1+AI-Gen
 * for more details.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ContentTypeProps } from 'contentful-management';
import { FinalEntriesResultSchema, FinalEntriesResult } from './schema';

/**
 * Configuration for the document parser
 */
export interface DocumentParserConfig {
  openAiApiKey: string;
  // TODO: Update this when we have oauth working
  document: unknown; // JSON document from Google Docs API or test data
  contentTypes: ContentTypeProps[];
  locale?: string;
}

/**
 * AI Agent that parses a Google Doc JSON and extracts structured entries
 * based on provided Contentful content type definitions.
 *
 * @param config - Parser configuration including API key, document JSON, and content types
 * @returns Promise resolving to entries ready for CMA client
 */
export async function createDocument(config: DocumentParserConfig): Promise<FinalEntriesResult> {
  // TODO: Double check these values and make sure they are compatible because not every user will have a key
  // to access all models
  const modelVersion = 'gpt-4o';
  const temperature = 0.3;

  const { document, openAiApiKey, contentTypes, locale = 'en-US' } = config;

  const openaiClient = createOpenAI({
    apiKey: openAiApiKey,
  });

  console.log('Document Parser Agent document content Input:', document);
  const prompt = buildExtractionPrompt({ contentTypes, document, locale });
  const result = await generateObject({
    model: openaiClient(modelVersion),
    schema: FinalEntriesResultSchema,
    temperature,
    system: buildSystemPrompt(),
    prompt,
  });

  const finalResult = result.object as FinalEntriesResult;
  console.log('Document Parser Agent Result:', JSON.stringify(result, null, 2));

  return finalResult;
}

function buildSystemPrompt(): string {
  return `You are an expert content extraction AI that analyzes documents and extracts structured content based on Contentful content type definitions.

Your role is to:
1. Carefully read and understand the document content
2. Analyze the provided Contentful content type definitions (their fields, types, and validations)
3. Extract relevant information from the document that matches the content type structure
4. Create properly formatted entries that are ready to be created in Contentful via the CMA API

CRITICAL FIELD TYPE RULES - READ CAREFULLY:
- Symbol: Short text (max 256 characters) - use for titles, names, IDs ✓
- Text: Long text (any length) - use for descriptions, content ✓
- Number: Integer or decimal values only ✓
- Boolean: true or false only ✓
- Date: ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ) ✓
- Location: { lat: number, lon: number } ✓
- Object: JSON object (use sparingly, check validations) ✓
- Array (of Symbol/Text/Number): Array of PRIMITIVE values ONLY ✓
  Example: ["value1", "value2"] or [1, 2, 3]
- Array (of Link): ❌ NEVER USE - these reference other entries, skip entirely
  Example: DO NOT create [{ title: "x", content: "y" }] - this will FAIL
- Link/Reference: ❌ NEVER USE - skip these fields (they reference other entries)
- RichText: Use ONLY the annotation tokens present in the provided document text. The extractor has already encoded Google Docs styles as simple tags:
  - <B>...</B> = bold, <I>...</I> = italic, <U>...</U> = underline (these may be nested for combinations)
  - <A href="URL">text</A> = hyperlink to URL
  - <CODE>...</CODE> = inline code (monospace)
  - <HR/> on its own line = horizontal rule
  - ![alt](URL) = image reference (do not modify)
  Do NOT introduce additional Markdown emphasis (** * _). If the source text contains the words "bold", "italic", "underline" as plain words, leave them unstyled.

STRICT TOKEN POLICY (MANDATORY):
- Treat <B>, <I>, <U>, <A>, <CODE>, <HR/>, and ![...](...) tokens as immutable markers of styles/assets that already exist in the source.
- NEVER add new style tokens that are not already present in the provided document text.
- NEVER remove, move, or re-wrap existing tokens around different text.
- If a sentence has no tokens, output it as plain text (no emphasis, no markdown, no HTML).
- The literal words "bold", "italic", and "underline" MUST remain plain unless they are already wrapped by tokens in the provided text.
- If you are unsure about styling, prefer plain text.

COPY-PASTE EXTRACTION METHOD (NON-NEGOTIABLE):
- When setting Text or RichText fields, copy exact substrings from the provided document content.
- Allowed transformations ONLY: trim leading/trailing whitespace; collapse sequences of more than one space into a single space; normalize Windows/Mac newlines to "\n".
- Disallowed: paraphrasing, reordering, inventing tokens, adding emphasis, or inserting example markup.
- Before returning, for every RichText string you produced, VERIFY that each occurrence of <B>, <I>, <U>, <A>, <CODE>, <HR/>, and ![...](...) also appears in the same order in the provided document content. If any token you added does not exist in the source, REMOVE it and return the plain text instead.
- RichText: Provide a Markdown string preserving inline styles:
  - Bold: **bold**
  - Italic: *italic*
  - Underline: _underline_ (or <u>underline</u>)
  - Images: include literal markdown tokens ![alt](url) when present in the document

FIELD FORMAT RULES:
- Each entry must have a contentTypeId that matches one of the provided content types
- Fields must be in the format: { "fieldId": { "locale": value } }
- Only include fields that exist in the content type definition
- NEVER include Reference/Link fields (type: "Link")
- NEVER include fields with type "Array" if items.type is "Link"
- NEVER create arrays of objects like [{ title: "x", content: "y" }] - this will FAIL
- If a field type is unclear or complex, SKIP it rather than guess

COMMON MISTAKES TO AVOID:
❌ WRONG: { "sections": { "en-US": [{ "title": "...", "content": "..." }] } }
✓ CORRECT: Skip "sections" field entirely if it's an Array of Links
✓ CORRECT: { "tags": { "en-US": ["tag1", "tag2", "tag3"] } } (if tags is Array of Symbol)

EXTRACTION GUIDELINES:
*** BE VERY CAREFUL TO NOT INVENT TEXT OR STRUCTURE THAT IS NOT PRESENT IN THE DOCUMENT ***
EXAMPLE: If the document has the word "bold" in it, do not invent bold text in your output
- Extract all relevant content from the document - don't skip entries
- If a required field cannot be populated from the document, use a sensible default or placeholder
- Be thorough and extract as many valid entries as you can find
- Focus on simple fields: Symbol, Text, Number, Boolean, Date
- IMPORTANT FOR IMAGES: If the document content contains markdown image tokens like ![image](URL), include them verbatim in the most relevant RichText field so downstream processing can embed assets. Do NOT rewrite or drop these tokens.`;
}

function buildExtractionPrompt({
  contentTypes,
  document,
  locale,
}: {
  contentTypes: ContentTypeProps[];
  document: unknown;
  locale: string;
}): string {
  const contentTypeList = contentTypes.map((ct) => `${ct.name} (ID: ${ct.sys.id})`).join(', ');
  const totalFields = contentTypes.reduce((sum, ct) => sum + (ct.fields?.length || 0), 0);

  // Create a detailed view of content types, filtering out unsupported field types
  const contentTypeDefinitions = contentTypes.map((ct) => {
    const fields =
      ct.fields?.map((field) => {
        const isLinkType = field.type === 'Link';
        const isArrayOfLinks = field.type === 'Array' && (field.items as any)?.type === 'Link';
        const shouldSkip = isLinkType || isArrayOfLinks;

        return {
          id: field.id,
          name: field.name,
          type: field.type,
          linkType: (field as any).linkType,
          items: field.type === 'Array' ? (field.items as any) : undefined,
          required: field.required,
          localized: field.localized,
          validations: field.validations,
          SKIP: shouldSkip,
          SKIP_REASON: shouldSkip
            ? isLinkType
              ? 'Link/Reference field - cannot be populated without entry IDs'
              : 'Array of Links - cannot be populated without entry IDs'
            : undefined,
        };
      }) || [];

    return {
      id: ct.sys.id,
      name: ct.name,
      description: ct.description,
      fields,
    };
  });

  return `Extract structured entries from the following Google Docs JSON document based on the provided Contentful content type definitions.

AVAILABLE CONTENT TYPES: ${contentTypeList}
TOTAL CONTENT TYPES: ${contentTypes.length}
TOTAL FIELDS ACROSS ALL TYPES: ${totalFields}
LOCALE TO USE: ${locale}

CONTENT TYPE DEFINITIONS:
${JSON.stringify(contentTypeDefinitions, null, 2)}

=== GOOGLE DOCS JSON PARSING GUIDE ===

The document is in Google Docs API JSON format. Here's how to interpret the structure:

**DOCUMENT STRUCTURE:**
- \`documentId\`: Unique identifier for the document
- \`tabs[].documentTab.body.content[]\`: Array of content elements (paragraphs, tables, sections)
- \`tabs[].documentTab.inlineObjects\`: Object mapping inlineObjectId → image/embedded object data
- \`tabs[].documentTab.lists\`: Object mapping listId → list configuration (bullet/numbered)

**CONTENT ELEMENT TYPES:**

1. **Paragraphs** - Main text content:
   \`\`\`
   {
     "paragraph": {
       "elements": [{ "textRun": { "content": "text\\n", "textStyle": {...} } }],
       "paragraphStyle": { "namedStyleType": "HEADING_1" | "HEADING_2" | "NORMAL_TEXT" | ... },
       "bullet": { "listId": "kix.xxx", "nestingLevel": 0 }  // if it's a list item
     }
   }
   \`\`\`
   - \`namedStyleType\`: HEADING_1, HEADING_2, HEADING_3, HEADING_4, HEADING_5, HEADING_6, NORMAL_TEXT, TITLE, SUBTITLE
   - \`bullet.listId\`: References list definition in \`lists\` object (indicates bullet/numbered list)
   - \`bullet.nestingLevel\`: Indentation level (0 = top level)

2. **Text Runs** - Inline text with formatting:
   \`\`\`
   {
     "textRun": {
       "content": "the actual text content",
       "textStyle": {
         "bold": true/false,
         "italic": true/false,
         "underline": true/false,
         "strikethrough": true/false,
         "link": { "url": "https://..." },
         "foregroundColor": { "color": { "rgbColor": { "red": 0-1, "green": 0-1, "blue": 0-1 } } },
         "fontSize": { "magnitude": 11, "unit": "PT" }
       }
     }
   }
   \`\`\`

3. **Inline Object Elements** - References to images:
   \`\`\`
   { "inlineObjectElement": { "inlineObjectId": "kix.xxx" } }
   \`\`\`
   - Look up the actual image in \`inlineObjects["kix.xxx"]\`
   - Image URL is at: \`inlineObjects[id].inlineObjectProperties.embeddedObject.imageProperties.contentUri\`

4. **Rich Links** - Embedded links with previews (YouTube, etc.):
   \`\`\`
   { "richLink": { "richLinkId": "kix.xxx", "richLinkProperties": { "title": "...", "uri": "..." } } }
   \`\`\`

5. **Tables** - Structured tabular data:
   \`\`\`
   {
     "table": {
       "rows": number,
       "columns": number,
       "tableRows": [{
         "tableCells": [{
           "content": [/* paragraphs */]
         }]
       }]
     }
   }
   \`\`\`
   - Each cell contains an array of paragraph elements
   - First row is typically headers

6. **Lists** - Bullet and numbered lists:
   - Paragraphs with \`bullet\` property are list items
   - \`bullet.listId\` references the list definition in \`lists\`
   - Check \`lists[listId].listProperties.nestingLevels[0].glyphSymbol\` for bullet character
   - Check \`lists[listId].listProperties.nestingLevels[0].glyphType\` for numbered list type (DECIMAL, ALPHA, ROMAN)

**EXTRACTING TEXT CONTENT:**
1. Navigate to \`tabs[0].documentTab.body.content\`
2. For each element, check if it has \`paragraph\`, \`table\`, or \`sectionBreak\`
3. For paragraphs:
   - Get heading level from \`paragraphStyle.namedStyleType\`
   - Concatenate all \`elements[].textRun.content\` values
   - Apply formatting based on \`textStyle\` (bold → **, italic → *, underline → _)
   - Check for \`bullet\` to identify list items
4. For tables:
   - Iterate through \`tableRows[].tableCells[].content\` to get cell text
   - Use first row as headers if appropriate

**FORMATTING CONVERSION:**
When extracting RichText fields, convert Google Docs formatting to Markdown:
- textStyle.bold: true → **text**
- textStyle.italic: true → *text*
- textStyle.underline: true → _text_ or <u>text</u>
- textStyle.strikethrough: true → ~~text~~
- textStyle.link.url → [text](url)
- HEADING_1 → # heading
- HEADING_2 → ## heading
- HEADING_3 → ### heading
- Bullet lists → - item
- Numbered lists → 1. item

=== END PARSING GUIDE ===

GOOGLE DOCS JSON DOCUMENT:
${JSON.stringify(document, null, 2)}

CRITICAL INSTRUCTIONS:
*** BE VERY CAREFUL TO NOT INVENT TEXT OR STRUCTURE THAT IS NOT PRESENT IN THE DOCUMENT ***
EXAMPLE: If the document has the word "bold" in it, do not invent bold text in your output
1. **PARSE THE GOOGLE DOCS JSON** - Use the parsing guide above to extract text and structure
2. **SKIP ALL FIELDS WHERE "SKIP": true** - Do NOT include these fields in your output
3. Look at each field definition - if it has "SKIP": true, completely ignore that field
4. Only include fields where "SKIP" is false or not present
5. Analyze the document and identify content that matches the provided content type structures
6. Extract all relevant entries from the document
7. For each entry, use the contentTypeId that best matches the content
8. Format fields correctly: { "fieldId": { "${locale}": value } }
9. Match field types exactly:
   - Symbol: string (max 256 chars)
   - Text: string (any length)
   - RichText: string using ONLY the provided annotation tokens (<B>, <I>, <U>, <A href="...">text</A>, <CODE>, <HR/>, and ![alt](URL)). Do not invent Markdown emphasis.

VALIDATION CHECKLIST BEFORE YOU RETURN:
- [ ] I did not add any <B>/<I>/<U>/<A>/<CODE>/<HR/>/![...](...) tokens that were not present in the provided document content.
- [ ] I did not wrap the literal words "bold", "italic", or "underline" with any style unless they were already wrapped in the provided text.
- [ ] Paragraphs without tokens are left as plain text.
- [ ] I preserved tokens exactly as given (content and order). 
 - [ ] Every RichText value is an exact substring (after trivial whitespace normalization) of the provided document content.
   - Number: number
   - Boolean: boolean
   - Date: ISO 8601 string
   - Array: array of primitives (strings or numbers ONLY)
   - Object: JSON object
10. For required fields (required: true) that are NOT marked SKIP: true, ensure they are populated
11. If you cannot populate a required field from the document, use a sensible default or placeholder
12. Be thorough - extract all valid content from the document

**CONTENT EXTRACTION TIPS:**
- Look for HEADING_1 or HEADING_2 paragraphs as entry titles
- Normal paragraphs following headings are typically body content
- Tables may contain structured data that maps to entry fields
- Lists can be extracted as array fields (if type is Array of Symbol/Text)
- Image URLs from inlineObjects can populate URL/Symbol fields

Return the extracted entries in the specified JSON schema format.`;
}
