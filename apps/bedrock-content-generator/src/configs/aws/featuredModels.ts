import { InvokeModelCommandInput } from '@aws-sdk/client-bedrock-runtime';

/** Maps AWS region to geography prefix for inference profile IDs (us/eu/global). */
export function getInferenceProfilePrefix(region: string): 'us' | 'eu' | 'global' {
  if (region.startsWith('eu-')) return 'eu';
  if (region.startsWith('us-') || region.startsWith('ca-')) return 'us';
  return 'global';
}

export interface BedrockModel {
  id: string;
  name: string;
  /** When set, used as modelId for InvokeModel (inference profile ID); otherwise id is used. Backward compat: existing models omit this. */
  getInvokeId?: (region: string) => string;
  invokeCommand: (
    systemPrompt: string,
    prompt: string,
    maxTokens?: number,
    region?: string
  ) => InvokeModelCommandInput;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parseResponse: (response: any) => string;
}

interface ContentBlockDeltaMsg {
  type: 'content_block_delta';
  delta: {
    text: string;
    type: 'text_delta';
  };
}

interface ContentBlockStartMsg {
  type: 'content_block_start';
  content_block: {
    text: string;
    type: 'text';
  };
}

class ClaudeModel implements BedrockModel {
  id: string;
  name: string;
  getInvokeId?: (region: string) => string;

  constructor(id: string, name: string, getInvokeId?: (region: string) => string) {
    this.id = id;
    this.name = name;
    this.getInvokeId = getInvokeId;
  }

  invokeCommand(
    systemPrompt: string,
    prompt: string,
    maxTokens?: number,
    region?: string
  ): InvokeModelCommandInput {
    const modelId = this.getInvokeId && region !== undefined ? this.getInvokeId(region) : this.id;
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt || 'hi',
          },
        ],
      },
    ];

    return {
      modelId,
      contentType: 'application/json',

      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: maxTokens || 128,
        system: systemPrompt,
        messages,
      }),
    };
  }

  parseResponse(response: ContentBlockDeltaMsg | ContentBlockStartMsg) {
    console.log('res', response);
    if (response.type == 'content_block_delta') return response.delta.text;

    return '';
  }
}

class LlamaModel implements BedrockModel {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  invokeCommand(
    systemPrompt: string,
    prompt: string,
    maxTokens?: number,
    region?: string
  ): InvokeModelCommandInput {
    void region; // optional for interface compat; Llama uses direct model ID only
    const completePrompt = `
${systemPrompt}

Human: ${prompt}

Assistant:`;

    return {
      modelId: this.id,
      contentType: 'application/json',
      body: JSON.stringify({
        prompt: completePrompt,
        ...(maxTokens && { max_gen_len: maxTokens }),
      }),
    };
  }

  parseResponse(response: { generation: string }) {
    return response.generation;
  }
}

class MistralModel implements BedrockModel {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  invokeCommand(
    systemPrompt: string,
    prompt: string,
    maxTokens?: number,
    region?: string
  ): InvokeModelCommandInput {
    void region; // optional for interface compat; Mistral uses direct model ID only
    const completePrompt = `<s>[INST] ${systemPrompt} [/INST]
[INST] ${prompt} [/INST]`;

    return {
      modelId: this.id,
      contentType: 'application/json',
      body: JSON.stringify({
        prompt: completePrompt,
        ...(maxTokens && { max_tokens: maxTokens }),
      }),
    };
  }

  parseResponse(response: { outputs: { text: string }[] }) {
    return response['outputs'][0]['text'];
  }
}

/** Inference profile IDs for models that require them (on-demand no longer supports raw model ID). See AWS docs: inference-profiles-use, inference-profiles-support. */
function inferenceProfileId(region: string, profileIdByPrefix: Record<string, string>): string {
  const prefix = getInferenceProfilePrefix(region);
  return profileIdByPrefix[prefix] ?? profileIdByPrefix['us'] ?? profileIdByPrefix['global'];
}

export const defaultModelId = 'anthropic.claude-sonnet-4-6';
export const defaultModelDisplayName = 'Anthropic Claude Sonnet 4.6';

export const featuredModels: BedrockModel[] = [
  // Modern Claude models (use inference profiles; raw model ID causes ValidationException on-demand)
  new ClaudeModel(
    defaultModelId,
    defaultModelDisplayName,
    () => 'global.anthropic.claude-sonnet-4-6'
  ),
  new ClaudeModel(
    'anthropic.claude-sonnet-4-5-20250929-v1:0',
    'Anthropic Claude Sonnet 4.5',
    (region) =>
      inferenceProfileId(region, {
        global: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
        us: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        eu: 'eu.anthropic.claude-sonnet-4-5-20250929-v1:0',
      })
  ),
  new ClaudeModel(
    'anthropic.claude-sonnet-4-20250514-v1:0',
    'Anthropic Claude Sonnet 4',
    (region) =>
      inferenceProfileId(region, {
        global: 'global.anthropic.claude-sonnet-4-20250514-v1:0',
        us: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
        eu: 'eu.anthropic.claude-sonnet-4-20250514-v1:0',
      })
  ),
  new ClaudeModel(
    'anthropic.claude-3-5-haiku-20241022-v1:0',
    'Anthropic Claude 3.5 Haiku',
    (region) =>
      inferenceProfileId(region, {
        us: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        eu: 'eu.anthropic.claude-3-5-haiku-20241022-v1:0',
      })
  ),
  new ClaudeModel('anthropic.claude-3-haiku-20240307-v1:0', 'Anthropic Claude 3 Haiku', (region) =>
    inferenceProfileId(region, {
      us: 'us.anthropic.claude-3-haiku-20240307-v1:0',
      eu: 'eu.anthropic.claude-3-haiku-20240307-v1:0',
    })
  ),
  // Existing models that require inference profiles (v3 Sonnet) or direct model ID (v2.1, Instant)
  new ClaudeModel(
    'anthropic.claude-3-sonnet-20240229-v1:0',
    'Anthropic Claude v3 Sonnet',
    (region) =>
      inferenceProfileId(region, {
        us: 'us.anthropic.claude-3-sonnet-20240229-v1:0',
        eu: 'eu.anthropic.claude-3-sonnet-20240229-v1:0',
      })
  ),
  new ClaudeModel('anthropic.claude-v2:1', 'Anthropic Claude v2.1'),
  new ClaudeModel('anthropic.claude-instant-v1', 'Anthropic Claude Instant v1.2'),
  new LlamaModel('meta.llama2-70b-chat-v1', 'Meta Llama 2 70B'),
  new MistralModel('mistral.mixtral-8x7b-instruct-v0:1', 'Mistral Mixtral 8x7B'),
];
