import { createOpenAI } from '@ai-sdk/openai';
import { FinalContentTypesResultSummary, FinalContentTypesAnalysisSchema } from './schema';
import { generateObject } from 'ai';
import { ContentTypeProps } from 'contentful-management';

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

  console.log('Content Type Parser Agent content types Input:', contentTypes);
  const prompt = buildAnalysisPrompt(contentTypes);

  const result = await generateObject({
    model: openaiClient(modelVersion),
    schema: FinalContentTypesAnalysisSchema,
    temperature,
    system: buildSystemPrompt(),
    prompt,
  });

  const finalAnalysis = result.object as FinalContentTypesResultSummary;
  console.log('Content Type Parser Agent Result:', finalAnalysis);

  return finalAnalysis;
}

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
