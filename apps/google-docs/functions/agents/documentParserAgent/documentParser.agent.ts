/**
 * INTEG-3263: Content Type Parser Agent
 *
 * Simple agent that takes JSON input and sends it to OpenAI/ChatGPT
 * to generate Contentful content type definitions.
 * See https://contentful.atlassian.net/wiki/spaces/ECO/pages/5850955777/RFC+Google+Docs+V1+AI-Gen
 * for more details.
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

/**
 * Configuration for the content type parser
 */
interface DocumentParserConfig {
  openaiApiKey: string;
  modelVersion: string;
  jsonData: any;
  document: any;
}

/**
 * @param jsonData - JSON data to analyze
 * @param config - Parser configuration
 * @returns Promise resolving to LLM response
 */
export async function createDocument(config: DocumentParserConfig) {
  const { openaiApiKey, modelVersion, jsonData, document } = config;
  const prompt = buildPrompt(jsonData);
  return await callOpenAI(prompt, modelVersion, openaiApiKey);
}

function buildPrompt(jsonData: any): string {
  // TODO: Create prompt template for the AI to consume
  // 1. Add instructions for content type generation
  // 2. Include JSON data
  // 3. Specify output format
  return `Parse the document and create a json object that represents the document for the Contetful API to consume: ${JSON.stringify(
    jsonData,
    null,
    2
  )}`;
}

async function callOpenAI(prompt: string, modelVersion: string, openaiApiKey: string) {
  const model = openai(modelVersion);

  // ai-sdk documentation: https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text
  // Select the appropriate core function from the list of options
  const result = await generateText({
    model,
    prompt,
  });
  return result;
}
