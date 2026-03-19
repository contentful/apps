import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  WORKFLOW_AGENT_ID,
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
  USE_LOCAL_AGENTS_API,
} from '../utils/constants/agent';

interface UseAnalyzePromptParams {
  sdk: PageAppSDK;
  documentId: string;
  oauthToken: string;
}

interface AnalyzePromptResult {
  isAnalyzing: boolean;
  analysisResult: string | null;
  error: string | null;
  analyze: (contentTypeIds: string[]) => Promise<void>;
  clearAnalysis: () => void;
}

interface AgentRunData {
  payload?: string;
  messages?: Array<{
    role: string;
    content?: {
      parts?: Array<{
        type: string;
        text?: string;
      }>;
    };
  }>;
  error?: Record<string, unknown>;
}

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getAgentPayload = (data: AgentRunData): string | null => {
  if (data.payload && typeof data.payload === 'string') {
    return data.payload;
  }

  if (!data.messages || !Array.isArray(data.messages)) {
    return null;
  }

  const assistantMessage = data.messages.find((m) => m.role === 'assistant');
  if (!assistantMessage?.content?.parts) {
    return null;
  }

  const textPart = assistantMessage.content.parts.find((p) => p.type === 'text' && p.text);
  return textPart?.text || null;
};

const pollAgentRun = async (
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  runId: string
): Promise<string> => {
  await wait(POLL_INTERVAL_MS);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    let runData: AgentRunData;

    if (USE_LOCAL_AGENTS_API) {
      const response = await fetch(
        `http://localhost:4111/spaces/${spaceId}/environments/${environmentId}/ai_agents/runs/${runId}`,
        {
          headers: {
            'x-contentful-enable-alpha-feature': 'agents-api',
          },
        }
      );

      if (response.status === 404) {
        await wait(POLL_INTERVAL_MS);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Failed to poll agent run: ${response.status} ${response.statusText}`);
      }

      runData = (await response.json()) as AgentRunData;
    } else {
      try {
        runData = (await sdk.cma.agentRun.get({
          spaceId,
          environmentId,
          runId,
        })) as AgentRunData;
      } catch (error: unknown) {
        const err = error as { code?: string };
        if (err?.code === 'NotFound') {
          await wait(POLL_INTERVAL_MS);
          continue;
        }
        throw error;
      }
    }

    const payload = getAgentPayload(runData);
    if (payload) {
      console.log('[Analyze Polling] Success - Assistant text content:\n\n' + payload);
      return payload;
    }

    await wait(POLL_INTERVAL_MS);
  }

  throw new Error('Analysis polling timeout');
};

export const useAnalyzePrompt = ({
  sdk,
  documentId,
  oauthToken,
}: UseAnalyzePromptParams): AnalyzePromptResult => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
  }, []);

  const analyze = useCallback(
    async (contentTypeIds: string[]) => {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;
      const threadId = [crypto.randomUUID(), WORKFLOW_AGENT_ID].join('-');

      const payload = {
        messages: [
          {
            role: 'user' as const,
            parts: [
              {
                type: 'text' as const,
                text: `Analyze the following google docs document ${documentId} and extract the Contentful entries and assets for the following content types: ${contentTypeIds.join(
                  ', '
                )} with the following oauth token: ${oauthToken}`,
              },
            ],
          },
        ],
        metadata: {
          documentId,
          contentTypeIds,
          oauthToken,
        },
        threadId,
      };

      try {
        const startTime = Date.now();

        if (USE_LOCAL_AGENTS_API) {
          fetch(
            `http://localhost:4111/spaces/${spaceId}/environments/${environmentId}/ai_agents/agents/${WORKFLOW_AGENT_ID}/generate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-contentful-enable-alpha-feature': 'agents-api',
              },
              body: JSON.stringify(payload),
            }
          ).catch((err) => {
            console.error('Failed to start analyzer agent run:', err);
          });
        } else {
          sdk.cma.agent
            .generate({ agentId: WORKFLOW_AGENT_ID, spaceId, environmentId }, payload)
            .catch((err: unknown) => {
              console.error('Failed to start analyzer agent run:', err);
            });
        }

        const result = await pollAgentRun(sdk, spaceId, environmentId, threadId);

        const endTime = Date.now();
        const totalSeconds = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`[Analyze] Completed in ${totalSeconds}s`);

        setAnalysisResult(result);
      } catch (err) {
        console.error('Analysis failed:', err);
        setError(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [sdk, documentId, oauthToken]
  );

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyze,
    clearAnalysis,
  };
};
