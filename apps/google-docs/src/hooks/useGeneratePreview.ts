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
  let response: any;

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
    response = await fetch(
      `http://localhost:4111/spaces/${spaceId}/environments/${environmentId}/ai_agents/agents/${AGENT_ID}/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-contentful-enable-alpha-feature': 'agents-api',
        },
        body: JSON.stringify(payload),
      }
    );
  } else {
    response = await sdk.cma.agent.generate({ agentId: AGENT_ID, spaceId, environmentId }, payload);
  }

  const data = await response.text();
  let parsedData: any;
  try {
    parsedData = JSON.parse(data);
    console.log('parsedData', parsedData);
  } catch {
    throw new Error('Failed to parse google docs agent response as JSON');
  }

  return parseAgentResponse(parsedData);
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
