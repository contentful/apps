import { useMemo } from 'react';
import { streamText, LanguageModelV1 } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { createAzure } from '@ai-sdk/azure';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { CmaService, createCmaClient } from '@services/cmaService';
import { buildTools } from '@configs/tools';
import { AppInstallationParameters, Provider } from '../types';

const SYSTEM_PROMPT = `You are Contentful Copilot, an AI assistant that helps users manage their Contentful space through natural language.

You have access to tools that let you interact with the user's Contentful space. When the user asks you to perform actions, use the appropriate tools to carry them out.

Guidelines:
- Always confirm before calling delete_entry — ask the user to confirm, then proceed if they say yes.
- NEVER guess or invent content type IDs. Always call list_content_types first to get the real IDs before searching, creating, or filtering by content type.
- Present lists in a clear, readable format. For entries, show the most meaningful fields.
- If a tool call fails, explain the error clearly and suggest next steps.
- For create_content_type, remind the user to publish after creating if they want to use it immediately.
- Be concise but informative. Prefer bullet points for lists.`;

interface UseAgentLoopOptions {
  params: AppInstallationParameters;
  spaceId: string;
  environmentId: string;
  defaultLocale: string;
  cmaAdapter: object;
  onStreamingUpdate: (content: string) => void;
  onToolCall: (toolName: string) => void;
}

interface AgentLoopResult {
  result: Promise<string>;
  abort: () => void;
}

export function useAgentLoop(options: UseAgentLoopOptions) {
  const { params, spaceId, environmentId, defaultLocale, cmaAdapter, onStreamingUpdate, onToolCall } =
    options;

  const cmaService = useMemo(() => {
    const client = createCmaClient(cmaAdapter);
    return new CmaService(client, spaceId, environmentId);
  }, [cmaAdapter, spaceId, environmentId]);

  const runAgentLoop = (
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): AgentLoopResult => {
    const controller = new AbortController();

    const result = (async (): Promise<string> => {
      const model = getModel(params);
      const tools = buildTools(cmaService, defaultLocale);

      const { fullStream } = streamText({
        model,
        system: SYSTEM_PROMPT,
        messages: history,
        tools,
        maxSteps: 15,
        abortSignal: controller.signal,
      });

      let fullText = '';
      for await (const chunk of fullStream) {
        if (chunk.type === 'text-delta') {
          fullText += chunk.textDelta;
          onStreamingUpdate(fullText);
        } else if (chunk.type === 'tool-call') {
          onToolCall(chunk.toolName);
        } else if (chunk.type === 'error') {
          throw chunk.error;
        }
      }

      return fullText;
    })();

    return { result, abort: () => controller.abort() };
  };

  return { runAgentLoop };
}

function getModel(params: AppInstallationParameters): LanguageModelV1 {
  const provider: Provider = params.provider ?? 'anthropic';

  switch (provider) {
    case 'anthropic': {
      const client = createAnthropic({
        apiKey: params.apiKey ?? '',
        headers: { 'anthropic-dangerous-direct-browser-access': 'true' },
      });
      return client(params.modelId ?? 'claude-sonnet-4-6');
    }

    case 'openai': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createOpenAI({ apiKey: params.apiKey ?? '', dangerouslyAllowBrowser: true } as any);
      return client(params.modelId ?? 'gpt-4o');
    }

    case 'bedrock': {
      const bedrockConfig: Parameters<typeof createAmazonBedrock>[0] = {
        region: params.awsRegion ?? 'us-east-1',
        accessKeyId: params.awsAccessKeyId ?? '',
        secretAccessKey: params.awsSecretAccessKey ?? '',
      };
      if (params.awsSessionToken) {
        bedrockConfig.sessionToken = params.awsSessionToken;
      }
      const client = createAmazonBedrock(bedrockConfig);
      return client(params.modelId ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0');
    }

    case 'azure': {
      const client = createAzure({
        apiKey: params.azureApiKey ?? '',
        resourceName: params.azureResourceName ?? '',
      });
      return client(params.modelId ?? 'gpt-4o');
    }

    case 'google': {
      const client = createGoogleGenerativeAI({
        apiKey: params.apiKey ?? '',
      });
      return client(params.modelId ?? 'gemini-2.0-flash');
    }
  }
}
