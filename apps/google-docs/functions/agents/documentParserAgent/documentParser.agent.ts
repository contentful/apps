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
import { fetchGoogleDocAsJson } from '../../service/googleDriveService';

/**
 * Configuration for the document parser
 */
export interface DocumentParserConfig {
  documentId: string;
  oauthToken: string;
  contentTypes: ContentTypeProps[];
  openAiApiKey: string;
  locale?: string;
}

/**
 * AI Agent that parses a Google Doc JSON and extracts structured entries
 * based on provided Contentful content type definitions.
 *
 * @param config - Parser configuration including API key, document JSON, and content types
 * @returns Promise resolving to entries ready for CMA client
 */
export async function createPreviewWithAgent(
  config: DocumentParserConfig
): Promise<FinalEntriesResult> {
  // TODO: Double check these values and make sure they are compatible because not every user will have a key
  // to access all models
  const modelVersion = 'gpt-4o';
  const temperature = 0.3;

  const { documentId, oauthToken, openAiApiKey, contentTypes, locale = 'en-US' } = config;

  const openaiClient = createOpenAI({
    apiKey: openAiApiKey,
  });

  console.log('Document Parser Agent document content Input:', documentId);
  const documentJson = await fetchGoogleDocAsJson({ documentId, oauthToken });
  const prompt = buildExtractionPrompt({ contentTypes, documentJson, locale });
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
5. Identify and establish references between entries extracted from the same document

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
- Link/Reference: Use reference placeholders ✓ (see REFERENCE HANDLING below)
- Array (of Link): Use array of reference placeholders ✓ (see REFERENCE HANDLING below)

=== REFERENCE HANDLING (CRITICAL) ===

When content in the document should reference another entry (from the SAME document), use the reference placeholder system:

**Step 1: Assign tempId to referenced entries**
Any entry that will be referenced by another entry MUST have a "tempId" field.
Format: contentTypeId_n (e.g., "author_1", "tag_1", "tag_2", "category_1")

**Step 2: Use { "__ref": "tempId" } for single references**
For Link fields (single reference), set the value to: { "__ref": "tempId_of_target" }

**Step 3: Use [{ "__ref": "tempId1" }, { "__ref": "tempId2" }] for array references**
For Array of Link fields, set the value to an array of reference placeholders.

**Example:**
Document contains:
- A blog post titled "My Journey" by author "John Doe"
- Tags: "Technology", "AI"
- Author section about "John Doe"

Output:
{
  "entries": [
    {
      "tempId": "author_1",
      "contentTypeId": "author",
      "fields": { "name": { "en-US": "John Doe" }, "bio": { "en-US": "..." } }
    },
    {
      "tempId": "tag_1",
      "contentTypeId": "tag",
      "fields": { "name": { "en-US": "Technology" } }
    },
    {
      "tempId": "tag_2",
      "contentTypeId": "tag",
      "fields": { "name": { "en-US": "AI" } }
    },
    {
      "contentTypeId": "blogPost",
      "fields": {
        "title": { "en-US": "My Journey" },
        "author": { "en-US": { "__ref": "author_1" } },
        "tags": { "en-US": [{ "__ref": "tag_1" }, { "__ref": "tag_2" }] }
      }
    }
  ]
}

**Reference Detection Rules:**
1. Look at the content type definitions to identify which fields are Link or Array of Link types
2. When you see content that matches a Link field (e.g., "Author: John Doe" for a blogPost.author field):
   - Check if there's a corresponding entry being created for that referenced content
   - If yes, create the referenced entry with a tempId and use { "__ref": "tempId" }
   - If the referenced content type is in the available content types but no explicit content exists, create a minimal entry for it
3. For Array of Link fields (e.g., tags, categories, related posts):
   - Create separate entries for each item with tempIds
   - Use an array of { "__ref": "tempId" } placeholders
4. Only create references to entries from the SAME document - do NOT reference external entries
5. Entries with tempId (referenced entries) should appear BEFORE the entries that reference them

**IMPORTANT: Check linkContentType validation**
- Link fields may have a "linkContentType" validation specifying which content types can be linked
- Only create references to entries whose contentTypeId matches the allowed linkContentType
- Example: If author field has linkContentType: ["author"], only reference entries with contentTypeId "author"

=== END REFERENCE HANDLING ===

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
   
4. Link Content Type Validation:
   - If a Link field has linkContentType validation, only reference entries of those content types
   - Check the validations array for linkContentType: ["allowedType1", "allowedType2"]
   
5. Other Validations:
   - Check for any other validation rules in the validations array
   - Respect regex patterns, enum values, unique constraints, etc.
   - If a validation cannot be satisfied, adjust the value to meet the constraint

VALIDATION CHECKLIST FOR EACH FIELD:
- Checked the validations array for this field
- If size validation exists: Value length is between min and max (adjusted if needed)
- If range validation exists: Number is within min and max (clamped if needed)
- If required: Field is populated (not empty, null, or undefined)
- If Link/Array of Link: Used { "__ref": "tempId" } format with valid tempId
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
- Allowed transformations ONLY: trim leading/trailing whitespace; collapse sequences of more than one space into a single space; normalize Windows/Mac newlines to "\\n".
- Disallowed: paraphrasing, reordering, inventing tokens, adding emphasis, or inserting example markup.
- Before returning, for every RichText string you produced, VERIFY that each occurrence of <B>, <I>, <U>, <A>, <CODE>, <HR/>, and ![...](...) also appears in the same order in the provided document content. If any token you added does not exist in the source, REMOVE it and return the plain text instead.
- RichText: Provide a Markdown string preserving inline styles:
  - Bold: **bold**
  - Italic: *italic*
  - Underline: _underline_ (or <u>underline</u>)
  - Images: include literal markdown tokens ![alt](url) when present in the document

FIELD FORMAT RULES:
- Each entry must have a contentTypeId that matches one of the provided content types
- Entries that are referenced should have a tempId (format: contentTypeId_n)
- Fields must be in the format: { "fieldId": { "locale": value } }
- Only include fields that exist in the content type definition
- For Link fields: use { "__ref": "tempId" } to reference another entry
- For Array of Link fields: use [{ "__ref": "tempId1" }, { "__ref": "tempId2" }]

COMMON MISTAKES TO AVOID:
❌ WRONG: { "author": { "en-US": "John Doe" } } (for a Link field - this is a string, not a reference)
✓ CORRECT: { "author": { "en-US": { "__ref": "author_1" } } } (proper reference placeholder)

❌ WRONG: { "tags": { "en-US": ["Technology", "AI"] } } (for Array of Link field - these are strings)
✓ CORRECT: { "tags": { "en-US": [{ "__ref": "tag_1" }, { "__ref": "tag_2" }] } } (proper reference array)

❌ WRONG: Creating a reference without a corresponding entry with that tempId
✓ CORRECT: Every { "__ref": "X" } has a matching entry with tempId: "X"

Making up text or structure that is not present in the document, which is forbidden.
Do not add styling or formatting that is not present in the document.
Example: If the document has the word "bold" in it, do not invent bold text in your output.

EXTRACTION GUIDELINES:
*** BE VERY CAREFUL TO NOT INVENT TEXT OR STRUCTURE THAT IS NOT PRESENT IN THE DOCUMENT ***
EXAMPLE: If the document has the word "bold" in it, do not invent bold text in your output
- Extract all relevant content from the document - don't skip entries
- If a required field cannot be populated from the document, use a sensible default or placeholder
- Be thorough and extract as many valid entries as you can find
- For Link fields, identify relationships between content and create proper references
- IMPORTANT FOR IMAGES AND DRAWINGS: 
  * If the document contains inlineObjectElement references, extract the image URL from inlineObjects[id].inlineObjectProperties.embeddedObject.imageProperties.contentUri
  * If embeddedDrawingProperties exists, it's a Google Drawing (but still use the imageProperties.contentUri)
  * Include them as markdown image tokens like ![alt](URL) in the most relevant RichText field
  * Use alt text like "Drawing" or "Image" or descriptive text if available
  * Do NOT rewrite or drop these tokens - they will be processed as assets downstream`;
}

function buildExtractionPrompt({
  contentTypes,
  documentJson,
  locale,
}: {
  contentTypes: ContentTypeProps[];
  documentJson: unknown;
  locale: string;
}): string {
  const contentTypeList = contentTypes.map((ct) => `${ct.name} (ID: ${ct.sys.id})`).join(', ');
  const totalFields = contentTypes.reduce((sum, ct) => sum + (ct.fields?.length || 0), 0);

  // Create a detailed view of content types with reference field information
  const contentTypeDefinitions = contentTypes.map((ct) => {
    const fields =
      ct.fields?.map((field) => {
        const isLinkType = field.type === 'Link';
        const isArrayOfLinks = field.type === 'Array' && (field.items as any)?.type === 'Link';
        const isReferenceField = isLinkType || isArrayOfLinks;
        const validations = field.validations || [];

        // Extract linkContentType from validations if present
        const linkContentTypeValidation = validations.find((v: any) => v.linkContentType);
        const allowedContentTypes = linkContentTypeValidation
          ? (linkContentTypeValidation as any).linkContentType
          : null;

        // For array of links, also check items validations
        const itemsValidations = (field.items as any)?.validations || [];
        const itemsLinkContentType = itemsValidations.find((v: any) => v.linkContentType);
        const allowedItemContentTypes = itemsLinkContentType
          ? (itemsLinkContentType as any).linkContentType
          : null;

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
                  if (v.linkContentType) return `Can link to: ${v.linkContentType.join(', ')}`;
                  return 'Has validation rules';
                })
                .join('; ')
            : 'No validation rules',
          IS_REFERENCE_FIELD: isReferenceField,
          REFERENCE_TYPE: isLinkType ? 'single' : isArrayOfLinks ? 'array' : null,
          ALLOWED_CONTENT_TYPES: allowedContentTypes || allowedItemContentTypes || 'any',
          USAGE: isReferenceField
            ? isLinkType
              ? 'Use { "__ref": "tempId" } to reference another entry'
              : 'Use [{ "__ref": "tempId1" }, ...] to reference multiple entries'
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
${JSON.stringify(documentJson, null, 2)}

CRITICAL INSTRUCTIONS:
*** BE VERY CAREFUL TO NOT INVENT TEXT OR STRUCTURE THAT IS NOT PRESENT IN THE DOCUMENT ***
EXAMPLE: If the document has the word "bold" in it, do not invent bold text in your output

1. **PARSE THE GOOGLE DOCS JSON** - Use the parsing guide above to extract text and structure

2. **IDENTIFY REFERENCE RELATIONSHIPS** - Look at fields marked IS_REFERENCE_FIELD: true
   - These fields should reference other entries using { "__ref": "tempId" }
   - Check ALLOWED_CONTENT_TYPES to know which content types can be referenced
   - Check REFERENCE_TYPE to know if it's a single reference or array of references

3. **CREATE REFERENCED ENTRIES FIRST** - Entries that will be referenced must:
   - Have a tempId (format: contentTypeId_n, e.g., "author_1", "tag_1")
   - Appear BEFORE the entries that reference them in the entries array

4. **USE REFERENCE PLACEHOLDERS** - For reference fields:
   - Single: { "fieldId": { "${locale}": { "__ref": "tempId" } } }
   - Array: { "fieldId": { "${locale}": [{ "__ref": "tempId1" }, { "__ref": "tempId2" }] } }

5. Analyze the document and identify content that matches the provided content type structures
6. Extract all relevant entries from the document
7. For each entry, use the contentTypeId that best matches the content
8. Format fields correctly: { "fieldId": { "${locale}": value } }
9. Match field types exactly:
   - Symbol: string (check validations for character limits)
   - Text: string (check validations for character limits)
   - RichText: string using ONLY the provided annotation tokens
   - Number: number (check validations for range limits)
   - Boolean: boolean
   - Date: ISO 8601 string
   - Array (of primitives): array of strings or numbers
   - Link: { "__ref": "tempId" }
   - Array (of Link): [{ "__ref": "tempId1" }, { "__ref": "tempId2" }]

10. **CRITICAL: RESPECT ALL FIELD VALIDATIONS**
    - Each field has a "validations" array and "validationSummary" in the content type definitions
    - You MUST check and respect ALL validation rules for each field
    - For reference fields, check ALLOWED_CONTENT_TYPES

11. For required fields: Always populate them (use defaults if document doesn't provide)
12. If you cannot populate a required field from the document, use a sensible default or placeholder that meets validation rules
13. Be thorough - extract all valid content from the document

VALIDATION CHECKLIST BEFORE YOU RETURN:
- [ ] I checked the "validations" array for EVERY field I populated
- [ ] All character count limits (size.min, size.max) are respected
- [ ] All number ranges (range.min, range.max) are respected
- [ ] All required fields are populated
- [ ] Every { "__ref": "X" } has a corresponding entry with tempId: "X"
- [ ] Referenced entries appear BEFORE the entries that reference them
- [ ] Reference fields use the correct format ({ "__ref": "..." } or [{ "__ref": "..." }])
- [ ] I did not add any tokens that were not present in the provided document content
- [ ] Every RichText value is an exact substring of the provided document content

**CONTENT EXTRACTION TIPS:**
- Look for HEADING_1 or HEADING_2 paragraphs as entry titles
- Normal paragraphs following headings are typically body content
- Tables may contain structured data that maps to entry fields
- Lists can be extracted as array fields or as multiple related entries
- When you see patterns like "Author: Name" or "Tags: X, Y, Z", these often indicate references
- Create separate entries for referenced content (authors, tags, categories) with tempIds
- Image URLs from inlineObjects can populate URL/Symbol fields or be included in RichText

Return the extracted entries in the specified JSON schema format.`;
}
