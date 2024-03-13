import { InvokeModelCommandInput } from '@aws-sdk/client-bedrock-runtime';

export interface BedrockModel {
  id: string;
  name: string;
  invokeCommand: (
    systemPrompt: string,
    prompt: string,
    maxTokens?: number
  ) => InvokeModelCommandInput;
  parseResponse: (response: any) => string;
}

class ClaudeModel implements BedrockModel {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  invokeCommand(systemPrompt: string, prompt: string, maxTokens?: number): InvokeModelCommandInput {
    const completePrompt = `
${systemPrompt}

Make sure you follow the exact requirements in the input.

Human: ${prompt}

Assistant:`;

    return {
      modelId: this.id,
      contentType: 'application/json',
      body: JSON.stringify({
        prompt: completePrompt,
        ...(maxTokens && { max_tokens_to_sample: maxTokens }),
        temperature: 0.8,
      }),
    };
  }

  parseResponse(response: { completion: string }) {
    return response.completion;
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
