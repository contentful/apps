/**
 * Plan Agent
 *
 * Agent that analyzes an array of content types to understand their relationships.
 * This is used to visualize the content model in the UI before creating entries.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ContentTypeProps } from 'contentful-management';
import { ContentTypeRelationshipAnalysisSchema, ContentTypeRelationshipAnalysis } from './schema';

/**
 * Configuration for the plan agent
 */
export interface PlanAgentConfig {
  openAiApiKey: string;
  contentTypes: ContentTypeProps[];
}

/**
 * AI Agent that analyzes content types to understand their relationships.
 * Returns a structured analysis for UI visualization.
 *
 * @param config - Plan agent configuration including API key and content types
 * @returns Promise resolving to a relationship analysis
 */
export async function analyzeContentTypeRelationships(
  config: PlanAgentConfig
): Promise<ContentTypeRelationshipAnalysis> {
  const modelVersion = 'gpt-4o';
  const temperature = 0.3;

  const { openAiApiKey, contentTypes } = config;

  const openaiClient = createOpenAI({
    apiKey: openAiApiKey,
  });

  console.log(
    'Plan Agent - Analyzing content types:',
    contentTypes.map((ct) => ct.name).join(', ')
  );

  const prompt = buildAnalysisPrompt(contentTypes);

  const result = await generateObject({
    model: openaiClient(modelVersion),
    schema: ContentTypeRelationshipAnalysisSchema,
    temperature,
    system: buildSystemPrompt(),
    prompt,
  });

  const analysis = result.object as ContentTypeRelationshipAnalysis;
  console.log('Plan Agent - Relationship Analysis:', JSON.stringify(analysis, null, 2));

  return analysis;
}

function buildSystemPrompt(): string {
  return `You are an expert at analyzing Contentful content models and understanding relationships between content types.

Your role is to:
1. Analyze the structure of each content type
2. Identify reference fields (fields that link to other entries)
3. Determine relationships between content types
4. Provide a clear summary for UI visualization

REFERENCE FIELD IDENTIFICATION:
- Type "Link" with linkType "Entry" = reference to another entry
- Type "Array" with items.type "Link" and items.linkType "Entry" = array of references
- Check validations for "linkContentType" to see which content types can be referenced

RELATIONSHIP ANALYSIS:
For each reference field:
- Source: The content type that HAS the reference field
- Target: The content type(s) that can be referenced
- relationType: "single" for Link, "many" for Array
- Check if the target is in the selected content types set

OUTPUT REQUIREMENTS:
- For each content type: summary with counts and reference fields
- For each relationship: clear source → target mapping with field info
- Overall summary: describe the content model structure
- Be concise and clear for UI display

Example: "3 content types selected: Blog Post references Author and Category"`;
}

function buildAnalysisPrompt(contentTypes: ContentTypeProps[]): string {
  const contentTypeIds = contentTypes.map((ct) => ct.sys.id);
  const contentTypeNames = contentTypes.map((ct) => ct.name).join(', ');

  // Create detailed content type information focusing on reference fields
  const contentTypeDetails = contentTypes.map((ct) => {
    const referenceFields =
      ct.fields
        ?.filter((field) => {
          const isLink = field.type === 'Link' && (field as any).linkType === 'Entry';
          const isArrayOfLinks =
            field.type === 'Array' &&
            (field.items as any)?.type === 'Link' &&
            (field.items as any)?.linkType === 'Entry';
          return isLink || isArrayOfLinks;
        })
        .map((field) => {
          const linkContentType = field.validations?.find((v: any) => v.linkContentType);
          return {
            id: field.id,
            name: field.name,
            type: field.type,
            linkType: (field as any).linkType,
            items: field.type === 'Array' ? (field.items as any) : undefined,
            validations: linkContentType,
          };
        }) || [];

    return {
      id: ct.sys.id,
      name: ct.name,
      description: ct.description,
      totalFields: ct.fields?.length || 0,
      referenceFields,
    };
  });

  return `Analyze the following Contentful content types and their relationships.

SELECTED CONTENT TYPES: ${contentTypeNames}
CONTENT TYPE IDS: ${contentTypeIds.join(', ')}
TOTAL: ${contentTypes.length}

CONTENT TYPE DETAILS:
${JSON.stringify(contentTypeDetails, null, 2)}

YOUR TASK:

1. **Analyze Each Content Type**:
   - Summarize each content type
   - List its reference fields (if any)
   - Determine if it has incoming or outgoing references

2. **Identify Relationships**:
   - For each reference field, create a ContentTypeRelationship
   - Source = content type that HAS the reference field
   - Target = content type(s) that can be referenced (from linkContentType validation)
   - If linkContentType validation is missing, the field can reference ANY content type
   - relationType = "single" for Link, "many" for Array
   - isInSelectedSet = true if target content type is in the selected set

3. **Generate Summary**:
   - Describe the content model in 1-2 sentences
   - Example: "3 content types selected: Blog Post references Author (single) and Category (many)"
   - Example: "2 content types with no relationships between them"

4. **Count Relationships**:
   - Total number of reference relationships identified

IMPORTANT NOTES:
- A reference field may reference multiple content types (check linkContentType array)
- Create a separate relationship entry for EACH referenced content type
- If a field can reference ANY content type (no linkContentType validation), still include it
- Only analyze the provided content types - don't invent relationships

Provide a structured analysis that can be used to visualize the content model in a UI.`;
}
