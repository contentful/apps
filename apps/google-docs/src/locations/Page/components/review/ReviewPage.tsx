import { useCallback, useState } from 'react';
import { Button, Flex, Heading, Layout } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { PageAppSDK } from '@contentful/app-sdk';
import type { MappingReviewSuspendPayload, CompletedWorkflowPayload } from '@types';
import { RunStatus } from '@types';
import { useWorkflowAgent } from '@hooks/useWorkflowAgent';
import Splitter from '../mainpage/Splitter';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import OverviewSection from '../overview/OverviewSection';
import { MappingView } from './mapping/MappingView';

interface ReviewPageProps {
  sdk: PageAppSDK;
  payload: MappingReviewSuspendPayload;
  runId?: string;
  onCancelReview: () => Promise<void>;
  onReturnToMainPage: () => void;
}

export const ReviewPage = ({
  sdk,
  payload,
  runId,
  onCancelReview,
  onReturnToMainPage,
}: ReviewPageProps) => {
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(0);
  const [isCancelling, setIsCancelling] = useState(false);

  const { resumeWorkflow } = useWorkflowAgent({ sdk, documentId: '', oauthToken: '' });

  const handleCreateEntries = useCallback(async (): Promise<CompletedWorkflowPayload | null> => {
    if (!runId) {
      onReturnToMainPage();
      return null;
    }

    try {
      const result = await resumeWorkflow(runId, {
        entryBlockGraph: payload.entryBlockGraph,
      });

      if (result.status === RunStatus.COMPLETED && 'googleDocPayload' in result) {
        return result.googleDocPayload;
      }

      onReturnToMainPage();
      return null;
    } catch (error) {
      console.error(error);
      onReturnToMainPage();
      return null;
    }
  }, [runId, resumeWorkflow, payload.entryBlockGraph, onReturnToMainPage]);

  const handleConfirmCancel = useCallback(async () => {
    setIsCancelling(true);

    try {
      await onCancelReview();
    } finally {
      setIsCancelling(false);
      setIsConfirmCancelModalOpen(false);
    }
  }, [onCancelReview]);

  const documentTitle =
    payload.normalizedDocument.title ?? payload.documentTitle ?? 'Selected document';
  const title = `Create from document "${documentTitle}"`;

  return (
    <>
      <Layout.Header title="Preview">
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingS">
          <Heading marginBottom="none">{title}</Heading>
          <Button
            variant="transparent"
            size="small"
            onClick={() => setIsConfirmCancelModalOpen(true)}
            aria-label="Cancel preview">
            Cancel
          </Button>
        </Flex>
      </Layout.Header>
      <Splitter marginTop="spacingS" />
      <Layout.Body>
        <Flex flexDirection="column" gap="spacingM" style={{ padding: tokens.spacingL }}>
          <OverviewSection
            sdk={sdk}
            payload={payload}
            selectedEntryIndex={selectedEntryIndex}
            onSelectEntryIndex={setSelectedEntryIndex}
            onCreateEntries={handleCreateEntries}
            onReturnToMainPage={onReturnToMainPage}
          />
          <MappingView payload={payload} selectedEntryIndex={selectedEntryIndex} />
        </Flex>
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={() => void handleConfirmCancel()}
        onCancel={() => !isCancelling && setIsConfirmCancelModalOpen(false)}
      />
    </>
  );
};
