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

  // Extract text content from Google Docs JSON structure
  const documentContent = extractTextFromGoogleDocsJson(document);

  const openaiClient = createOpenAI({
    apiKey: openAiApiKey,
  });

  const prompt = buildExtractionPrompt({ contentTypes, documentContent, locale });
  const result = await generateObject({
    model: openaiClient(modelVersion),
    schema: FinalEntriesResultSchema,
    temperature,
    system: buildSystemPrompt(),
    prompt,
  });

  return result.object as FinalEntriesResult;
}

// These should be improved by having an example prompt on top of this zero shot prompt
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
- RichText: Provide a Markdown string preserving inline styles:
  - Bold: **bold**
  - Italic: *italic*
  - Underline: _underline_ (or <u>underline</u>)

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
- Extract all relevant content from the document - don't skip entries
- If a required field cannot be populated from the document, use a sensible default or placeholder
- Be thorough and extract as many valid entries as you can find
- Focus on simple fields: Symbol, Text, Number, Boolean, Date`;
}

/**
 * Extracts plain text content from Google Docs JSON structure
 */
function extractTextFromGoogleDocsJson(document: unknown): string {
  if (!document || typeof document !== 'object') {
    return '';
  }

  const doc = document as Record<string, unknown>;
  const textParts: string[] = [];

  // Extract title if available
  if (typeof doc.title === 'string') {
    textParts.push(doc.title);
  }

  // Navigate through tabs -> documentTab -> body -> content
  if (Array.isArray(doc.tabs)) {
    for (const tab of doc.tabs) {
      if (typeof tab === 'object' && tab !== null) {
        const tabObj = tab as Record<string, unknown>;
        if (tabObj.documentTab && typeof tabObj.documentTab === 'object') {
          const docTab = tabObj.documentTab as Record<string, unknown>;
          if (docTab.body && typeof docTab.body === 'object') {
            const body = docTab.body as Record<string, unknown>;
            if (Array.isArray(body.content)) {
              for (const item of body.content) {
                if (typeof item === 'object' && item !== null) {
                  const itemObj = item as Record<string, unknown>;
                  // Extract text from paragraphs
                  if (itemObj.paragraph && typeof itemObj.paragraph === 'object') {
                    const para = itemObj.paragraph as Record<string, unknown>;
                    if (Array.isArray(para.elements)) {
                      for (const elem of para.elements) {
                        if (typeof elem === 'object' && elem !== null) {
                          const elemObj = elem as Record<string, unknown>;
                          if (elemObj.textRun && typeof elemObj.textRun === 'object') {
                            const textRun = elemObj.textRun as Record<string, unknown>;
                            if (typeof textRun.content === 'string') {
                              textParts.push(textRun.content);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return textParts.join(' ').trim();
}

function buildExtractionPrompt({
  contentTypes,
  documentContent,
  locale,
}: {
  contentTypes: ContentTypeProps[];
  documentContent: string;
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

  return `Extract structured entries from the following document based on the provided Contentful content type definitions.

AVAILABLE CONTENT TYPES: ${contentTypeList}
TOTAL CONTENT TYPES: ${contentTypes.length}
TOTAL FIELDS ACROSS ALL TYPES: ${totalFields}
LOCALE TO USE: ${locale}

CONTENT TYPE DEFINITIONS:
${JSON.stringify(contentTypeDefinitions, null, 2)}

DOCUMENT CONTENT:
${documentContent}

CRITICAL INSTRUCTIONS:
1. **SKIP ALL FIELDS WHERE "SKIP": true** - Do NOT include these fields in your output
2. Look at each field definition - if it has "SKIP": true, completely ignore that field
3. Only include fields where "SKIP" is false or not present
4. Analyze the document and identify content that matches the provided content type structures
5. Extract all relevant entries from the document
6. For each entry, use the contentTypeId that best matches the content
7. Format fields correctly: { "fieldId": { "${locale}": value } }
8. Match field types exactly:
   - Symbol: string (max 256 chars)
   - Text: string (any length)
   - RichText: string in Markdown (preserve bold **, italics *, underline _)
   - Number: number
   - Boolean: boolean
   - Date: ISO 8601 string
   - Array: array of primitives (strings or numbers ONLY)
   - Object: JSON object
9. For required fields (required: true) that are NOT marked SKIP: true, ensure they are populated
10. If you cannot populate a required field from the document, use a sensible default or placeholder
11. Be thorough - extract all valid content from the document

Return the extracted entries in the specified JSON schema format.`;
}
