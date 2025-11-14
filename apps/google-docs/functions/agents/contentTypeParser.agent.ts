/**
 * INTEG-3262: Content Type Parser Agent
 *
 * Agent that analyzes Contentful content type JSONs and generates
 * structured summaries for each content type.
 * See https://contentful.atlassian.net/wiki/spaces/ECO/pages/5850955777/RFC+Google+Docs+V1+AI-Gen
 * for more details.
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { ContentTypeProps } from 'contentful-management';

// ────────────────────────────────────────────────
// Schema Definitions
// ────────────────────────────────────────────────

/**
 * Simplified schema for field analysis
 */
const FieldAnalysisSchema = z.object({
  name: z.string(),
  type: z.string(),
  purpose: z.string(),
  required: z.boolean(),
});

/**
 * Simplified schema for content type summary
 */
const ContentTypeSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  purpose: z.string(),
  fieldCount: z.number(),
  keyFields: z.array(z.string()).describe('Names of the most important fields'),
  recommendations: z.array(z.string()),
});

/**
 * Simplified schema for the complete parse result
 */
const ParseResultSchema = z.object({
  contentTypes: z.array(ContentTypeSummarySchema),
  summary: z.string(),
  complexity: z.string(),
});

// ────────────────────────────────────────────────
// Type Exports
// ────────────────────────────────────────────────

export type ContentTypeSummary = z.infer<typeof ContentTypeSummarySchema>;
export type ParseResult = z.infer<typeof ParseResultSchema>;
export type FieldAnalysis = z.infer<typeof FieldAnalysisSchema>;

// ────────────────────────────────────────────────
// Main Parser Function
// ────────────────────────────────────────────────

/**
 * Configuration for the content type parser
 */
export interface ContentTypeParserConfig {
  modelVersion?: string;
  temperature?: number;
}

/**
 * Parses an array of Contentful content types and generates structured summaries
 *
 * @param contentTypes - Array of Contentful content type objects
 * @param config - Optional configuration for the AI model
 * @returns Promise resolving to structured parse result with summaries
 *
 * @example
 * ```typescript
 * const contentTypes = await cma.contentType.getMany({ contentTypeIds: ['blogPost', 'author'] });
 * const result = await parseContentTypes(contentTypes.items);
 * console.log(result.contentTypes[0].purpose);
 * ```
 */
export async function parseContentTypes(
  contentTypes: ContentTypeProps[],
  config: ContentTypeParserConfig = {}
): Promise<ParseResult> {
  const { modelVersion = 'gpt-4o', temperature = 0.3 } = config;

  console.log(`🔍 Parsing ${contentTypes.length} content type(s)...`);

  // Build the analysis prompt
  const prompt = buildAnalysisPrompt(contentTypes);

  // Generate structured output using AI SDK
  const result = await generateObject({
    model: openai(modelVersion),
    schema: ParseResultSchema,
    temperature,
    system: buildSystemPrompt(),
    prompt,
  });

  const parseResult = result.object as ParseResult;

  console.log(`✅ Successfully parsed ${parseResult.contentTypes.length} content type(s)`);

  return parseResult;
}

// ────────────────────────────────────────────────
// Prompt Building
// ────────────────────────────────────────────────

/**
 * Builds the system prompt for the AI
 */
function buildSystemPrompt(): string {
  return `You are an expert Contentful content modeling analyst. Your role is to analyze Contentful content type definitions and provide clear, actionable summaries.

Your analysis should:
1. Identify the purpose and intended use of each content type
2. Explain what each field represents and how it should be used
3. Identify relationships between content types
4. Assess the overall model complexity
5. Provide practical recommendations for content editors and developers

Focus on clarity and actionability. Your summaries will be used by:
- Content editors who need to understand how to use content types
- Content strategists planning content architecture`;
}

/**
 * Builds the analysis prompt from content type data
 */
function buildAnalysisPrompt(contentTypes: ContentTypeProps[]): string {
  const contentTypeList = contentTypes.map((ct) => ct.name).join(', ');
  const totalFields = contentTypes.reduce((sum, ct) => sum + (ct.fields?.length || 0), 0);

  return `Analyze the following Contentful content type definitions and provide concise summaries.

CONTENT TYPES TO ANALYZE: ${contentTypeList}
TOTAL CONTENT TYPES: ${contentTypes.length}
TOTAL FIELDS ACROSS ALL TYPES: ${totalFields}

CONTENT TYPE DEFINITIONS:
${JSON.stringify(contentTypes, null, 2)}

For each content type, provide:
1. Clear description of what this content type represents
2. The intended purpose and use cases
3. Total field count
4. Names of 3-5 most important/key fields
5. 2-3 practical usage recommendations

Also provide:
- Overall summary of the content model (2-3 sentences)
- Complexity assessment (simple/moderate/complex as a string)

Keep responses concise and actionable.`;
}

// ────────────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────────────

/**
 * Generates a plain text summary from a parse result
 * Useful for displaying summaries in UIs or logs
 */
export function generateTextSummary(parseResult: ParseResult): string {
  let output = `Content Model Summary\n`;
  output += `${'='.repeat(50)}\n\n`;
  output += `${parseResult.summary}\n\n`;
  output += `Complexity: ${parseResult.complexity}\n`;
  output += `Total Content Types: ${parseResult.contentTypes.length}\n\n`;

  parseResult.contentTypes.forEach((ct, index) => {
    output += `${index + 1}. ${ct.name} (${ct.id})\n`;
    output += `   ${ct.description}\n`;
    output += `   Purpose: ${ct.purpose}\n`;
    output += `   Fields: ${ct.fieldCount}\n`;
    if (ct.keyFields.length > 0) {
      output += `   Key Fields: ${ct.keyFields.join(', ')}\n`;
    }
    if (ct.recommendations.length > 0) {
      output += `   Recommendations:\n`;
      ct.recommendations.forEach((rec) => {
        output += `     - ${rec}\n`;
      });
    }
    output += `\n`;
  });

  return output;
}
