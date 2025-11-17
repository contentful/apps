/**
 * Content Type Parser Agent
 *
 * Agent that analyzes Contentful content type JSONs and generates
 * structured summaries for each content type.
 */

import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';

import { generateObject } from 'ai';
import { z } from 'zod';
import { ContentTypeProps } from 'contentful-management';

// ────────────────────────────────────────────────
// Schema Definitions Move these to a different file
// ────────────────────────────────────────────────

// Each invidual CT analysis by the AI Agent output schema
const ContentTypeAnalysisSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  purpose: z.string(),
  fieldCount: z.number(),
  keyFields: z.array(z.string()),
  recommendations: z.array(z.string()),
});

// The entire set of CT analyses by the AI Agent output schema
const FinalContentTypesAnalysisSchema = z.object({
  contentTypes: z.array(ContentTypeAnalysisSchema),
  summary: z.string(),
  complexity: z.string(),
});

export type ContentTypeSummary = z.infer<typeof ContentTypeAnalysisSchema>;
export type FinalContentTypesResultSummary = z.infer<typeof FinalContentTypesAnalysisSchema>;

export interface ContentTypeParserConfig {
  contentTypes: ContentTypeProps[];
  openAiApiKey: string;
}

/**
 * AI Agent that parses an array of Contentful content types and generates structured summaries
 *
 * @param contentTypes - Array of Contentful content type objects
 * @param config - Optional configuration for the AI model
 * @returns Promise resolving to structured parse result with summaries
 *
 */
export async function analyzeContentTypes({
  contentTypes,
  openAiApiKey,
}: ContentTypeParserConfig): Promise<FinalContentTypesResultSummary> {
  // TODO: Double check these values and make sure they are compatible because not every user will have a key
  // to access all models
  const modelVersion = 'gpt-4o';
  const temperature = 0.3;

  const openaiClient = createOpenAI({
    apiKey: openAiApiKey,
  });

  const prompt = buildAnalysisPrompt(contentTypes);

  const result = await generateObject({
    model: openaiClient(modelVersion),
    schema: FinalContentTypesAnalysisSchema,
    temperature,
    system: buildSystemPrompt(),
    prompt,
  });

  const finalAnalysis = result.object as FinalContentTypesResultSummary;
  return finalAnalysis;
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
