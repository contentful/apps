import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { callAppActionWithResult } from '../utils/appAction';
import { ERROR_MESSAGES } from '../utils/constants/messages';
import { PreviewEntry } from '../locations/Page/components/modals/step_3/PreviewModal';
import { getEntryTitle } from '../utils/getEntryTitle';
import {
  EntryToCreate,
  AssetToCreate,
  FinalEntriesResult,
} from '../../functions/agents/documentParserAgent/schema';

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

interface StreamEvent {
  type: string;
  delta?: string;
  [key: string]: unknown;
}

/**
 * Parse agent response to extract entries and assets to feed the cma create entries step
 */
const parseAgentResponse = (data: any): AgentResponse => {
  // The assistant message contains the ai agent's response for the document and content types analysis
  const assistantMessage = data.messages?.find((m: any) => m.role === 'assistant');
  if (!assistantMessage) {
    throw new Error('No assistant message found in agent response');
  }

  // Iterate through all parts to find one with entries JSON
  const parts = assistantMessage.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('Parts of the ai agent document analysis NOT found');
  }

  // Collect entries and assets from all parts
  const allEntries: EntryToCreate[] = [];
  const allAssets: AssetToCreate[] = [];
  for (const part of parts) {
    if (!part.text) continue;

    try {
      const parsed = JSON.parse(part.text);

      if (Array.isArray(parsed.entries)) {
        allEntries.push(...parsed.entries);
      }
      if (Array.isArray(parsed.assets)) {
        allAssets.push(...parsed.assets);
      }
    } catch {
      // We do not throw an error here because we want to continue parsing the other parts
      // and other parts may already be valid and correctly parsed
      console.warn('Failed to parse part:', { part, text: part.text });
    }
  }

  // If this condition triggers that means all parts were invalid and we did not find any entries or assets so throw the error
  if (allEntries.length === 0 && allAssets.length === 0) {
    throw new Error('No entries or assets found in the ai agent document analysis');
  }

  return { entries: allEntries, assets: allAssets };
};

/**
 * Parse a Server-Sent Events (SSE) stream from the Contentful agent.
 *
 * The agent stream sends events like:
 * - { type: 'start' } - Stream starts
 * - { type: 'text-delta', delta: '...' } - Incremental text content
 * - { type: 'text-end' } - Text complete
 * - { type: 'finish' } - Stream ends
 *
 * The text-delta events contain the actual JSON response being built incrementally.
 * We accumulate all deltas to get the complete JSON which has { entries: [], assets: [] }.
 */
const parseStreamEvent = async (response: Response): Promise<AgentResponse> => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  const textDeltas: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events (separated by double newlines)
      const events = buffer.split('\n\n');
      // Keep the last incomplete chunk in the buffer
      buffer = events.pop() || '';

      for (const event of events) {
        if (!event.trim()) continue;

        // Parse each line in the event
        const lines = event.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6); // Remove 'data: ' prefix

            // Check for stream termination signal
            if (dataContent === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(dataContent) as StreamEvent;
              // Accumulate text-delta events - these contain the actual JSON content
              if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
                textDeltas.push(parsed.delta);
              }
            } catch {
              // Some data chunks might not be valid JSON, skip them
              console.warn('Failed to parse SSE data chunk:', dataContent);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Combine all text deltas to get the complete JSON response
  const fullText = textDeltas.join('');

  if (!fullText.trim()) {
    throw new Error('No text content received from agent stream');
  }

  // Parse the accumulated JSON - should be { entries: [...], assets: [...] }
  let parsedResponse: { entries?: EntryToCreate[]; assets?: AssetToCreate[] };
  try {
    parsedResponse = JSON.parse(fullText);
  } catch (parseError) {
    console.error('[SSE] Failed to parse accumulated text as JSON:', parseError);
    console.error('[SSE] Raw text:', fullText);
    throw new Error('Failed to parse agent response as JSON');
  }

  return {
    entries: parsedResponse.entries ?? [],
    assets: parsedResponse.assets ?? [],
  };
};

/**
 * Call the agent - uses localhost fetch for dev, CMA SDK for production.
 * We will want to figure out a proper localhost development mechanism but for now we are limited to a direct fetch to the agent.
 */
const callGoogleDocsAgent = async (
  sdk: PageAppSDK,
  params: AgentCallParams
): Promise<AgentResponse> => {
  const { spaceId, environmentId, documentId, contentTypeIds, oauthToken } = params;
  const AGENT_ID = 'google-docs-agent';
  const useLocalDevAgent = true; // Turn to false to use production agents-api

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
  };

  if (useLocalDevAgent) {
    const response = await fetch(
      `http://localhost:4111/spaces/${spaceId}/environments/${environmentId}/ai_agents/agents/${AGENT_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-contentful-enable-alpha-feature': 'agents-api',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Agent request failed with status ${response.status}: ${response.statusText}`
      );
    }

    // Handle SSE stream response - returns AgentResponse directly
    return await parseStreamEvent(response);
  } else {
    const response = await sdk.cma.agent.generate(
      { agentId: AGENT_ID, spaceId, environmentId },
      payload
    );
    return parseAgentResponse(response);
  }
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

      try {
        const { entries, assets: agentAssets } = await callGoogleDocsAgent(sdk, {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          documentId,
          contentTypeIds,
          oauthToken,
        });

        // Build preview entries with title info
        const previewEntriesWithTitles: PreviewEntry[] = await Promise.all(
          entries.map(async (entry: EntryToCreate) => {
            const { title, contentTypeName } = await getEntryTitle({ sdk, entry });
            return { entry, title, contentTypeName };
          })
        );

        setPreviewEntries(previewEntriesWithTitles);
        setAssets(agentAssets);
      } catch (err) {
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
