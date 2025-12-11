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
- Symbol: Short text (default max 256 characters) - use for titles, names, IDs ✓
- Text: Long text (default max 50,000 characters) - use for descriptions, content ✓
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

FIELD VALIDATION RULES - MANDATORY TO RESPECT:
Each field definition includes a "validations" array. You MUST respect ALL validation rules:
1. Character Count Limits (size validation):
   - If a field has validations with size: { min: X, max: Y }:
     * The value MUST be between X and Y characters (inclusive)
     * For Symbol/Text fields: Ensure your extracted text meets these limits
     * If the document text is too short: Extend it intelligently (repeat key phrases, add context)
     * If the document text is too long: Truncate at word boundaries to stay within max
     * Example: If size: { min: 40, max: 60 }, a title must be 40-60 characters
   
2. Number Range Limits (range validation):
   - If a field has validations with range: { min: X, max: Y }:
     * The number MUST be between X and Y (inclusive)
     * If the document value is outside this range, adjust it to the nearest valid value
     * Example: If range: { min: 0, max: 10 }, a value of 15 becomes 10, -5 becomes 0
   
3. Required Fields:
   - If required: true, the field MUST be populated
   - If you cannot extract a value from the document, use a sensible default based on the field name/type
   - Never leave required fields empty or undefined
   
4. Other Validations:
   - Check for any other validation rules in the validations array
   - Respect regex patterns, enum values, unique constraints, etc.
   - If a validation cannot be satisfied, adjust the value to meet the constraint

VALIDATION CHECKLIST FOR EACH FIELD:
- Checked the validations array for this field
- If size validation exists: Value length is between min and max (adjusted if needed)
- If range validation exists: Number is within min and max (clamped if needed)
- If required: Field is populated (not empty, null, or undefined)
- All other validation rules are satisfied
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
Making up text or structure that is not present in the document, which is forbidden.
Do not add styling or formatting that is not present in the document.
Example: If the document has the word "bold" in it, do not invent bold text in your output.

EXTRACTION GUIDELINES:
*** BE VERY CAREFUL TO NOT INVENT TEXT OR STRUCTURE THAT IS NOT PRESENT IN THE DOCUMENT ***
EXAMPLE: If the document has the word "bold" in it, do not invent bold text in your output
- Extract all relevant content from the document - don't skip entries
- If a required field cannot be populated from the document, use a sensible default or placeholder
- Be thorough and extract as many valid entries as you can find
- Focus on simple fields: Symbol, Text, Number, Boolean, Date
- IMPORTANT FOR IMAGES AND DRAWINGS: 
  * If the document contains inlineObjectElement references, extract the image URL from inlineObjects[id].inlineObjectProperties.embeddedObject.imageProperties.contentUri
  * If embeddedDrawingProperties exists, it's a Google Drawing (but still use the imageProperties.contentUri)
  * Include them as markdown image tokens like ![alt](URL) in the most relevant RichText field
  * Use alt text like "Drawing" or "Image" or descriptive text if available
  * Do NOT rewrite or drop these tokens - they will be processed as assets downstream`;
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
        const validations = field.validations || [];

        return {
          id: field.id,
          name: field.name,
          type: field.type,
          linkType: (field as any).linkType,
          items: field.type === 'Array' ? (field.items as any) : undefined,
          required: field.required,
          localized: field.localized,
          validations,
          validationSummary: validations?.length
            ? validations
                .map((v: any) => {
                  if (v.size) return v.size.description;
                  if (v.range) return v.range.description;
                  if (v.enum) return v.enum.description;
                  if (v.regexp) return v.regexp.description;
                  if (v.unique) return v.unique.description;
                  return 'Has validation rules';
                })
                .join('; ')
            : 'No validation rules',
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

3. **Inline Object Elements** - References to images and drawings:
   \`\`\`
   { "inlineObjectElement": { "inlineObjectId": "kix.xxx" } }
   \`\`\`
   - **CRITICAL**: Each inlineObjectElement has a unique inlineObjectId - you MUST look up the correct one
   - Look up the actual object in \`inlineObjects["kix.xxx"]\` using the EXACT inlineObjectId from the element
   - For IMAGES: Image URL is at: \`inlineObjects[id].inlineObjectProperties.embeddedObject.imageProperties.contentUri\`
   - For GOOGLE DRAWINGS: Check for \`inlineObjects[id].inlineObjectProperties.embeddedObject.embeddedDrawingProperties\`
     * If present, the drawing can be accessed via: \`inlineObjects[id].inlineObjectProperties.embeddedObject.imageProperties.contentUri\`
     * Google Drawings are rendered as images, so they use the same contentUri structure as regular images
     * The presence of \`embeddedDrawingProperties\` (even if empty) indicates it's a drawing, not a regular image
   - **IMPORTANT**: When you see an inlineObjectElement with inlineObjectId "kix.ABC", you MUST look up inlineObjects["kix.ABC"] - do NOT use a different ID or the first image you find
   - Each inlineObjectElement in the document corresponds to a DIFFERENT image/drawing - extract the URL for EACH one separately

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
   - Check for \`inlineObjectElement\` to identify embedded images/drawings:
     * **CRITICAL**: For each inlineObjectElement, use its EXACT inlineObjectId to look up the object
     * Look up \`inlineObjects[inlineObjectId]\` where inlineObjectId comes from the element (e.g., "kix.ABC")
     * Extract image URL from \`inlineObjectProperties.embeddedObject.imageProperties.contentUri\`
     * Check if \`embeddedDrawingProperties\` exists to identify Google Drawings
     * Convert to markdown image token: \`![alt](url)\` where alt can be "Drawing" or "Image"
     * **DO NOT** reuse the same URL for multiple inlineObjectElements - each one has its own unique URL
4. For tables:
   - Iterate through \`tableRows[].tableCells[].content\` to get cell text
   - Use first row as headers if appropriate
   - Also check for \`inlineObjectElement\` within table cells
   - **CRITICAL**: Each inlineObjectElement in a table cell also has its own unique inlineObjectId - look it up separately

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
   - Symbol: string (check validations for character limits)
   - Text: string (check validations for character limits)
   - RichText: string using ONLY the provided annotation tokens (<B>, <I>, <U>, <A href="...">text</A>, <CODE>, <HR/>, and ![alt](URL)). Do not invent Markdown emphasis.
   - Number: number (check validations for range limits)
   - Boolean: boolean
   - Date: ISO 8601 string
   - Array: array of primitives (strings or numbers ONLY)
   - Object: JSON object

10. **CRITICAL: RESPECT ALL FIELD VALIDATIONS**
    - Each field has a "validations" array and "validationSummary" in the content type definitions
    - You MUST check and respect ALL validation rules for each field
    - For character count limits (size validation):
      * If min is specified: Ensure value is at least that many characters (extend if needed)
      * If max is specified: Ensure value is at most that many characters (truncate at word boundaries if needed)
      * If both min and max: Value must be between them (adjust as needed)
    - For number ranges (range validation):
      * Clamp values to the min/max range
    - For required fields: Always populate them (use defaults if document doesn't provide)
    - BEFORE setting any field value, check its validations and ensure compliance

11. For required fields (required: true) that are NOT marked SKIP: true, ensure they are populated
12. If you cannot populate a required field from the document, use a sensible default or placeholder that meets validation rules
13. Be thorough - extract all valid content from the document

VALIDATION CHECKLIST BEFORE YOU RETURN:
- [ ] I checked the "validations" array for EVERY field I populated
- [ ] All character count limits (size.min, size.max) are respected
- [ ] All number ranges (range.min, range.max) are respected
- [ ] All required fields are populated
- [ ] I did not add any <B>/<I>/<U>/<A>/<CODE>/<HR/>/![...](...) tokens that were not present in the provided document content.
- [ ] I did not wrap the literal words "bold", "italic", or "underline" with any style unless they were already wrapped in the provided text.
- [ ] Paragraphs without tokens are left as plain text.
- [ ] I preserved tokens exactly as given (content and order). 
- [ ] Every RichText value is an exact substring (after trivial whitespace normalization) of the provided document content.

**CONTENT EXTRACTION TIPS:**
- Look for HEADING_1 or HEADING_2 paragraphs as entry titles
- Normal paragraphs following headings are typically body content
- Tables may contain structured data that maps to entry fields
- Lists can be extracted as array fields (if type is Array of Symbol/Text)
- Image URLs from inlineObjects can populate URL/Symbol fields or be included in RichText as markdown tokens
- **GOOGLE DRAWINGS**: When you encounter \`inlineObjectElement\` with \`embeddedDrawingProperties\`:
  * Extract the image URL from \`inlineObjectProperties.embeddedObject.imageProperties.contentUri\`
  * Include it in RichText fields as a markdown image token: \`![Drawing](url)\` or \`![alt text](url)\`
  * Google Drawings are rendered as images, so treat them the same as regular images for extraction purposes
  * The drawing will be processed as an image asset in Contentful

Return the extracted entries in the specified JSON schema format.`;
}
