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
import { fetchGoogleDoc } from '../../service/googleDriveService';
import { FinalEntriesResultSchema, FinalEntriesResult } from './schema';

/**
 * Configuration for the document parser
 */
export interface DocumentParserConfig {
  openAiApiKey: string;
  googleDocUrl: string;
  contentTypes: ContentTypeProps[];
  locale?: string;
}

/**
 * AI Agent that parses a Google Doc and extracts structured entries
 * based on provided Contentful content type definitions.
 *
 * @param config - Parser configuration including API key, document URL, and content types
 * @returns Promise resolving to entries ready for CMA client
 */
export async function createDocument(config: DocumentParserConfig): Promise<FinalEntriesResult> {
  // TODO: Double check these values and make sure they are compatible because not every user will have a key
  // to access all models
  const modelVersion = 'gpt-4o';
  const temperature = 0.3;

  const { googleDocUrl, openAiApiKey, contentTypes, locale = 'en-US' } = config;
  const googleDocContent = await fetchGoogleDoc(googleDocUrl);

  const openaiClient = createOpenAI({
    apiKey: openAiApiKey,
  });

  const prompt = buildExtractionPrompt({ contentTypes, googleDocContent, locale });
  const result = await generateObject({
    model: openaiClient(modelVersion),
    schema: FinalEntriesResultSchema,
    temperature,
    system: buildSystemPrompt(),
    prompt,
  });

  return result.object as FinalEntriesResult;
}

function buildSystemPrompt(): string {
  return `You are an expert content extraction AI that analyzes documents and extracts structured content based on Contentful content type definitions.

Your role is to:
1. Carefully read and understand the document content
2. Analyze the provided Contentful content type definitions (their fields, types, and validations)
3. Extract relevant information from the document that matches the content type structure
4. Create properly formatted entries that are ready to be created in Contentful via the CMA API

Important guidelines:
- Each entry must have a contentTypeId that matches one of the provided content types
- Fields must be in the correct format: { "fieldId": { "locale": value } }
- Respect field types (Text, Symbol, RichText, Number, Boolean, Date, Reference, etc.)
- Only include fields that exist in the content type definition
- Extract all relevant content from the document - don't skip entries
- If a field is required in the content type, ensure it's populated
- For rich text fields, extract formatted content when possible
- Be thorough and extract as many valid entries as you can find in the document`;
}

function buildExtractionPrompt({
  contentTypes,
  googleDocContent,
  locale,
}: {
  contentTypes: ContentTypeProps[];
  googleDocContent: string;
  locale: string;
}): string {
  const contentTypeList = contentTypes.map((ct) => `${ct.name} (ID: ${ct.sys.id})`).join(', ');
  const totalFields = contentTypes.reduce((sum, ct) => sum + (ct.fields?.length || 0), 0);

  // Create a simplified view of content types for the prompt
  const contentTypeDefinitions = contentTypes.map((ct) => ({
    id: ct.sys.id,
    name: ct.name,
    description: ct.description,
    fields:
      ct.fields?.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        localized: field.localized,
        validations: field.validations,
      })) || [],
  }));

  return `Extract structured entries from the following document based on the provided Contentful content type definitions.

AVAILABLE CONTENT TYPES: ${contentTypeList}
TOTAL CONTENT TYPES: ${contentTypes.length}
TOTAL FIELDS ACROSS ALL TYPES: ${totalFields}
LOCALE TO USE: ${locale}

CONTENT TYPE DEFINITIONS:
${JSON.stringify(contentTypeDefinitions, null, 2)}

DOCUMENT CONTENT:
${googleDocContent}

INSTRUCTIONS:
1. Analyze the document and identify content that matches the provided content type structures
2. Extract all relevant entries from the document
3. For each entry, use the contentTypeId that best matches the content
4. Format fields correctly: { "fieldId": { "${locale}": value } }
5. Ensure all required fields are populated
6. Be thorough - extract all valid content from the document

Return the extracted entries in the specified JSON schema format.`;
}
