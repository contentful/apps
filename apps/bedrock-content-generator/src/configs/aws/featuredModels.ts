import { InvokeModelCommandInput } from "@aws-sdk/client-bedrock-runtime";

export interface BedrockModel {
  id: string;
  name: string;
  invokeCommand: (
    systemPrompt: string,
    prompt: string,
    maxTokens?: number,
  ) => InvokeModelCommandInput;
  outputKey: string;
}

class ClaudeModel implements BedrockModel {
  id: string;
  name: string;
  outputKey = "completion";
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  invokeCommand(
    systemPrompt: string,
    prompt: string,
    maxTokens?: number,
  ): InvokeModelCommandInput {
    const completePrompt = `
${systemPrompt}

Human: ${prompt}

Assistant:
`;
    return {
      modelId: this.id,
      contentType: "application/json",
      body: JSON.stringify({
        prompt: completePrompt,
        ...(maxTokens && { max_tokens_to_sample: maxTokens }),
        temperature: 0.8,
      }),
    };
  }
}

class LlamaModel implements BedrockModel {
  id: string;
  name: string;
  outputKey = "generation";
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  invokeCommand(
    systemPrompt: string,
    prompt: string,
    maxTokens?: number,
  ): InvokeModelCommandInput {
    const completePrompt = `
${systemPrompt}

Human: ${prompt}

Assistant:
`;

    return {
      modelId: this.id,
      contentType: "application/json",
      body: JSON.stringify({
        prompt: completePrompt,
        ...(maxTokens && { max_gen_len: maxTokens }),
      }),
    };
  }
}

export const featuredModels: BedrockModel[] = [
  new ClaudeModel("anthropic.claude-v2:1", "Anthropic Claude v2.1"),
  new ClaudeModel(
    "anthropic.claude-instant-v1",
    "Anthropic Claude Instant v1.2",
  ),
  new LlamaModel("meta.llama2-70b-chat-v1", "Meta Llama 2 70B"),
];

export const defaultModelId = featuredModels[0].id;
