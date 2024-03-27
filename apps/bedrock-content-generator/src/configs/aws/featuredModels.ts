import { InvokeModelCommandInput } from '@aws-sdk/client-bedrock-runtime';

export interface BedrockModel {
  id: string;
  name: string;
  invokeCommand: (
    systemPrompt: string,
    prompt: string,
    maxTokens?: number
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

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  invokeCommand(systemPrompt: string, prompt: string, maxTokens?: number): InvokeModelCommandInput {
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
      modelId: this.id,
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
  invokeCommand(systemPrompt: string, prompt: string, maxTokens?: number): InvokeModelCommandInput {
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

  invokeCommand(systemPrompt: string, prompt: string, maxTokens?: number): InvokeModelCommandInput {
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

export const featuredModels: BedrockModel[] = [
  new ClaudeModel('anthropic.claude-3-sonnet-20240229-v1:0', 'Anthropic Claude v3 Sonnet'),
  new ClaudeModel('anthropic.claude-v2:1', 'Anthropic Claude v2.1'),
  new ClaudeModel('anthropic.claude-instant-v1', 'Anthropic Claude Instant v1.2'),
  new LlamaModel('meta.llama2-70b-chat-v1', 'Meta Llama 2 70B'),
  new MistralModel('mistral.mixtral-8x7b-instruct-v0:1', 'Mistral Mixtral 8x7B'),
];

export const defaultModelId = featuredModels[0].id;
