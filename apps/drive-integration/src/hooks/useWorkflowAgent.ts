import { useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { WORKFLOW_AGENT_ID } from '../utils/constants/agent';
import { AgentGeneratePayload, DocumentSelection, startAgentRun } from '../services/agents-api';

interface UseWorkflowParams {
  sdk: PageAppSDK;
  documentId: string;
  oauthToken: string;
}

interface WorkflowHook {
  startWorkflow: (
    contentTypeIds: string[],
    documentSelection: DocumentSelection
  ) => Promise<string>;
}

export const useWorkflowAgent = ({
  sdk,
  documentId,
  oauthToken,
}: UseWorkflowParams): WorkflowHook => {
  const startWorkflow = useCallback(
    async (contentTypeIds: string[], documentSelection: DocumentSelection): Promise<string> => {
      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;
      const threadId = [crypto.randomUUID(), WORKFLOW_AGENT_ID].join('-');

      const payload: AgentGeneratePayload = {
        messages: [
          {
            role: 'user' as const,
            parts: [
              {
                type: 'text' as const,
                text: `Analyze the following google docs document ${documentId} and extract the Contentful entries and assets for the following content types: ${contentTypeIds.join(
                  ', '
                )}`,
              },
            ],
          },
        ],
        metadata: {
          documentId,
          contentTypeIds,
          oauthToken,
          documentSelection,
        },
        threadId,
      };

      try {
        return await startAgentRun(sdk, spaceId, environmentId, payload);
      } catch (err) {
        throw err instanceof Error ? err : new Error('Workflow failed');
      }
    },
    [sdk, documentId, oauthToken]
  );

  return { startWorkflow };
};
