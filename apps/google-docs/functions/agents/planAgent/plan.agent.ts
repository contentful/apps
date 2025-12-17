/**
 * Plan Agent
 *
 * Agent that analyzes an array of content types to build a simple relationship graph.
 * Returns a nested JSON structure showing which content types reference which others.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ContentTypeProps } from 'contentful-management';
import { ContentTypeRelationshipGraphSchema, ContentTypeRelationshipGraph } from './schema';

/**
 * Configuration for the plan agent
 */
export interface PlanAgentConfig {
  openAiApiKey: string;
  contentTypes: ContentTypeProps[];
}

/**
 * AI Agent that analyzes content types and builds a nested relationship graph.
 * Returns a simple tree structure for UI visualization.
 *
 * @param config - Plan agent configuration including API key and content types
 * @returns Promise resolving to a nested relationship graph
 */
export async function buildContentTypeGraph(
  config: PlanAgentConfig
): Promise<ContentTypeRelationshipGraph> {
  const modelVersion = 'gpt-4o';
  const temperature = 0.3;

  const { openAiApiKey, contentTypes } = config;

  const openaiClient = createOpenAI({
    apiKey: openAiApiKey,
  });

  console.log(
    'Plan Agent - Building graph for content types:',
    contentTypes.map((ct) => ct.name).join(', ')
  );

  const prompt = buildGraphPrompt(contentTypes);

  const result = await generateObject({
    model: openaiClient(modelVersion),
    schema: ContentTypeRelationshipGraphSchema,
    temperature,
    system: buildSystemPrompt(),
    prompt,
  });

  const graph = result.object as ContentTypeRelationshipGraph;
  console.log('Plan Agent - Relationship Graph:', JSON.stringify(graph, null, 2));

  return graph;
}

function buildSystemPrompt(): string {
  return `You are an expert at analyzing Contentful content models and creating visual relationship graphs.

Your role is to:
1. Identify reference fields in content types (type "Link" or Array of "Link")
2. Build a nested JSON structure showing the relationship hierarchy
3. Create a simple tree that shows which content types reference which others

OUTPUT FORMAT:
Create a nested JSON graph where:
- Each node has: { id: "contentTypeId", name: "Content Type Name", references: [...nested nodes...] }
- "references" array contains content types that this one references
- Nest the structure to show the hierarchy clearly
- Content types with no outgoing references have no "references" field or an empty array
- Content types with no incoming references should be at the root level

EXAMPLE OUTPUT:
\`\`\`json
{
  "graph": [
    {
      "id": "blogPost",
      "name": "Blog Post",
      "references": [
        {
          "id": "author",
          "name": "Author"
        },
        {
          "id": "category",
          "name": "Category"
        }
      ]
    }
  ],
  "summary": "Blog Post references Author and Category"
}
\`\`\`

Keep it simple and focused on the visual hierarchy for UI purposes.`;
}

function buildGraphPrompt(contentTypes: ContentTypeProps[]): string {
  const contentTypeIds = contentTypes.map((ct) => ct.sys.id);
  const contentTypeNames = contentTypes.map((ct) => ct.name).join(', ');

  // Extract reference information
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
            fieldId: field.id,
            fieldName: field.name,
            canReference: linkContentType?.linkContentType || ['any'],
          };
        }) || [];

    return {
      id: ct.sys.id,
      name: ct.name,
      referenceFields,
    };
  });

  return `Build a nested relationship graph for the following Contentful content types.

SELECTED CONTENT TYPES: ${contentTypeNames}
CONTENT TYPE IDS: ${contentTypeIds.join(', ')}

CONTENT TYPE DETAILS:
${JSON.stringify(contentTypeDetails, null, 2)}

YOUR TASK:

1. **Identify Root Content Types**: Content types that are NOT referenced by others should be at the root level
2. **Build Nested Structure**: For each content type that has reference fields, nest the referenced content types
3. **Keep It Simple**: Only include id and name for each node, plus nested references
4. **Avoid Duplicates**: If a content type appears in multiple places, that's okay (show the relationship)

STRUCTURE RULES:
- Start with content types that reference others (usually the "parent" content types)
- Nest their referenced content types in the "references" array
- Each node: { id: "contentTypeId", name: "Content Type Name", references?: [...] }
- If a content type doesn't reference anything, omit "references" or use empty array

EXAMPLE:
If Blog Post references Author and Category:
\`\`\`json
{
  "graph": [
    {
      "id": "blogPost",
      "name": "Blog Post",
      "references": [
        { "id": "author", "name": "Author" },
        { "id": "category", "name": "Category" }
      ]
    }
  ],
  "summary": "Blog Post references Author and Category"
}
\`\`\`

Now create the graph for the provided content types.`;
}
