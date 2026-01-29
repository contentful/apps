import { useState, useCallback, useRef } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { ERROR_MESSAGES } from '../utils/constants/messages';
import {
  AGENT_ID,
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
  isLocalDevAgent,
} from '../utils/constants/agent';
import { PreviewEntry } from '../locations/Page/components/modals/step_3/PreviewModal';
import { getEntryTitle } from '../utils/getEntryTitle';
import { EntryToCreate, AssetToCreate } from '../../functions/agents/documentParserAgent/schema';

interface AgentCallParams {
  spaceId: string;
  environmentId: string;
  documentId: string;
  contentTypeIds: string[];
  oauthToken: string;
}

interface AgentResponse {
  entries: EntryToCreate[];
  assets: AssetToCreate[];
}

interface AgentMessagePart {
  type: 'text' | 'tool-invocation' | 'step-start';
  text?: string;
}

interface AgentMessageContent {
  parts: AgentMessagePart[];
}

interface AgentMessage {
  role: 'assistant' | 'user';
  content?: AgentMessageContent;
}

interface AgentRunData {
  messages?: AgentMessage[];
}

/**
 * Extract the text part from the assistant message in agent response data.
 * Returns null if no valid assistant message with a text part is found.
 */
const getAgentPayload = (data: AgentRunData): string | null => {
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

/**
 * Check if an error is a 500 Internal Server Error
 */
const is500Error = (error: any): boolean => {
  if (error?.code !== 'UnknownError' || !error?.message) {
    return false;
  }

  try {
    const parsedMessage = JSON.parse(error.message);
    return parsedMessage?.status === 500;
  } catch {
    return error.message.includes('\\"status\\": 500');
  }
};

/**
 * Suppresses false 500 errors that occur from timeout
 */
const handleGenerateError = async (error: any, startTime: number): Promise<void> => {
  if (!is500Error(error)) {
    console.error('Failed to start agent run:', error);
    return;
  }

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  const TIMEOUT_THRESHOLD_SECONDS = 50;

  // Assume errors within 50s are likely timeouts
  if (elapsedSeconds < TIMEOUT_THRESHOLD_SECONDS) {
    console.error('Failed to start agent run:', error);
    return;
  }

  // Error happened after threshold - likely a timeout, suppress error
};

/**
 * Parse agent response to extract entries and assets to feed the cma create entries step
 */
const parseAgentResponse = (data: AgentRunData): AgentResponse => {
  const payload = getAgentPayload(data);
  if (!payload) {
    throw new Error('No assistant message with text part found in agent response');
  }

  try {
    const parsed = JSON.parse(payload);

    const entries: EntryToCreate[] = Array.isArray(parsed.entries) ? parsed.entries : [];
    const assets: AssetToCreate[] = Array.isArray(parsed.assets) ? parsed.assets : [];

    if (entries.length === 0 && assets.length === 0) {
      throw new Error('No entries or assets found in the ai agent document analysis');
    }

    return { entries, assets };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No entries or assets')) {
      throw error;
    }
    console.warn('Failed to parse agent response:', { payload, error });
    throw new Error('Failed to parse agent response JSON');
  }
};

const startAgentRun = (sdk: PageAppSDK, params: AgentCallParams): string => {
  const { spaceId, environmentId, documentId, contentTypeIds, oauthToken } = params;
  const threadId = [crypto.randomUUID(), AGENT_ID].join('-');

  const payload = {
    messages: [
      {
        role: 'user' as const,
        parts: [
          {
            type: 'text' as const,
            text: `Analyze the following google docs document ${documentId} and extract the Contentful entries and assets for the following content types: ${contentTypeIds} with the following oauth token: ${oauthToken}`,
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

  const startTime = Date.now();

  if (isLocalDevAgent()) {
    fetch(
      `http://localhost:4111/spaces/${spaceId}/environments/${environmentId}/ai_agents/agents/${AGENT_ID}/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-contentful-enable-alpha-feature': 'agents-api',
        },
        body: JSON.stringify(payload),
      }
    ).catch((error) => {
      console.error('Failed to start agent run:', error);
    });
  } else {
    sdk.cma.agent
      .generate({ agentId: AGENT_ID, spaceId, environmentId }, payload)
      .catch((error: any) => {
        return handleGenerateError(error, startTime);
      });
  }

  return threadId;
};

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const pollAgentRun = async (
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  runId: string,
  onCancel?: () => boolean
): Promise<AgentResponse> => {
  await wait(POLL_INTERVAL_MS);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    if (onCancel?.()) {
      throw new Error('Polling cancelled');
    }

    let runData: AgentRunData;

    if (isLocalDevAgent()) {
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
      } catch (error: any) {
        if (error?.code === 'NotFound') {
          await wait(POLL_INTERVAL_MS);
          continue;
        }
        throw error;
      }
    }

    if (getAgentPayload(runData)) {
      return parseAgentResponse(runData);
    }

    await wait(POLL_INTERVAL_MS);
  }

  throw new Error('Agent run polling timeout');
};

interface UseGeneratePreviewResult {
  isSubmitting: boolean;
  previewEntries: PreviewEntry[];
  assets: AssetToCreate[];
  error: Error | null;
  successMessage: string | null;
  submit: (contentTypeIds: string[]) => Promise<void>;
  clearMessages: () => void;
}

interface UseGeneratePreviewProps {
  sdk: PageAppSDK;
  documentId: string;
  oauthToken: string;
}

export const useGeneratePreview = ({
  sdk,
  documentId,
  oauthToken,
}: UseGeneratePreviewProps): UseGeneratePreviewResult => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([]);
  const [assets, setAssets] = useState<AssetToCreate[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const cancelPollingRef = useRef<boolean>(false);

  const validateSubmission = useCallback(
    (contentTypeIds: string[]): string | null => {
      const openAiApiKey = sdk.parameters.installation?.openAiApiKey as string | undefined;

      if (!openAiApiKey || !openAiApiKey.trim()) {
        return ERROR_MESSAGES.NO_API_KEY;
      }

      if (!documentId || !documentId.trim()) {
        return ERROR_MESSAGES.NO_DOCUMENT;
      }

      if (contentTypeIds.length === 0) {
        return ERROR_MESSAGES.NO_CONTENT_TYPE;
      }

      return null;
    },
    [sdk, documentId]
  );

  const submit = useCallback(
    async (contentTypeIds: string[]) => {
      const validationError = validateSubmission(contentTypeIds);
      if (validationError) {
        setError(new Error(validationError));
        setSuccessMessage(null);
        return;
      }

      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      cancelPollingRef.current = false;

      try {
        const runId = startAgentRun(sdk, {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          documentId,
          contentTypeIds,
          oauthToken,
        });

        const { entries, assets: agentAssets } = await pollAgentRun(
          sdk,
          sdk.ids.space,
          sdk.ids.environment,
          runId,
          () => cancelPollingRef.current
        );

        const previewEntriesWithTitles: PreviewEntry[] = await Promise.all(
          entries.map(async (entry: EntryToCreate) => {
            const { title, contentTypeName } = await getEntryTitle({ sdk, entry });
            return { entry, title, contentTypeName };
          })
        );

        setPreviewEntries(previewEntriesWithTitles);
        setAssets(agentAssets);
      } catch (err) {
        if (err instanceof Error && err.message === 'Polling cancelled') {
          return;
        }
        console.error(
          'Error generating preview:',
          err instanceof Error ? err.message : String(err)
        );
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsSubmitting(false);
      }
    },
    [sdk, documentId, oauthToken, validateSubmission]
  );

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  return {
    isSubmitting,
    previewEntries,
    assets,
    error,
    successMessage,
    submit,
    clearMessages,
  };
};
