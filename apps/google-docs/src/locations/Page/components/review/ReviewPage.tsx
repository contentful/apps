import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Flex, Heading, Layout } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { PageAppSDK } from '@contentful/app-sdk';
import type { EntryProps } from 'contentful-management';
import type { EntryBlockGraph, MappingReviewSuspendPayload } from '@types';
import { RunStatus } from '@types';
import { useWorkflowAgent } from '@hooks/useWorkflowAgent';
import { createEntriesFromPreviewPayload } from '../../../../services/entryService';
import type { ContentTypeDisplayInfoMap } from '../../../../utils/overviewEntryList';
import Splitter from '../mainpage/Splitter';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { ErrorModal } from '../modals/ErrorModal';
import { SummaryModal } from '../modals/SummaryModal';
import OverviewSection from '../overview/OverviewSection';
import { MappingView } from './mapping/MappingView';

interface ReviewPageProps {
  sdk: PageAppSDK;
  payload: MappingReviewSuspendPayload;
  runId?: string;
  onCancelReview: () => Promise<void>;
  onExitReview: () => void;
}

export const ReviewPage = ({
  sdk,
  payload,
  runId,
  onCancelReview,
  onExitReview,
}: ReviewPageProps) => {
  const [reviewMode, setReviewMode] = useState<'single' | 'all'>('all');
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [createdEntries, setCreatedEntries] = useState<EntryProps[] | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const reviewHeaderRef = useRef<HTMLDivElement | null>(null);
  const [entryBlockGraph, setEntryBlockGraph] = useState<EntryBlockGraph>(() =>
    structuredClone(payload.entryBlockGraph)
  );

  // Reset local graph when starting a different run; do not depend on payload.entryBlockGraph
  // alone or user edits would be wiped when the parent re-renders with a new object reference.
  useEffect(() => {
    setEntryBlockGraph(structuredClone(payload.entryBlockGraph));
    setReviewMode('all');
    setSelectedEntryIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-init on run identity
  }, [runId, payload.documentId]);

  const reviewPayload = useMemo(
    (): MappingReviewSuspendPayload => ({ ...payload, entryBlockGraph }),
    [payload, entryBlockGraph]
  );
  const contentTypeDisplayInfoMap = useMemo<ContentTypeDisplayInfoMap>(() => {
    const map = new Map<string, { name: string; displayField?: string }>();
    for (const contentType of payload.contentTypes) {
      map.set(contentType.sys.id, {
        name: contentType.name ?? contentType.sys.id,
        displayField: contentType.displayField,
      });
    }
    return map;
  }, [payload.contentTypes]);
  const hasCreatedEntries = createdEntries !== null;
  const isMappingDisabled = isCreatePending || hasCreatedEntries;

  const { resumeWorkflow } = useWorkflowAgent({ sdk, documentId: '', oauthToken: '' });

  const handleCreateEntries = useCallback(async (): Promise<void> => {
    if (!runId) {
      onExitReview();
      return;
    }

    setIsCreatePending(true);

    try {
      const result = await resumeWorkflow(runId, {
        entryBlockGraph,
      });

      if (result.status === RunStatus.COMPLETED && 'googleDocPayload' in result) {
        const entryCreationResult = await createEntriesFromPreviewPayload(
          sdk,
          result.googleDocPayload
        );
        const { createdEntries: entries, errors } = entryCreationResult;

        if (errors.length > 0) {
          setCreateError(
            errors[0]?.error ?? 'An unexpected error occurred while creating entries.'
          );
          return;
        }

        setCreatedEntries(entries);
        setReviewMode('all');
        setIsSummaryModalOpen(true);
        return;
      }

      // WorkflowRunResult is COMPLETED | PENDING_REVIEW; only PENDING_REVIEW reaches here.
      console.warn('[ReviewPage] workflow re-suspended after resume; status:', result.status);
      setCreateError('The review workflow did not return a completed payload.');
    } catch (error) {
      console.error(error);
      setCreateError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while creating entries.'
      );
    } finally {
      setIsCreatePending(false);
    }
  }, [runId, resumeWorkflow, entryBlockGraph, sdk, onExitReview]);

  const handleConfirmCancel = useCallback(async () => {
    setIsCancelling(true);

    try {
      await onCancelReview();
    } finally {
      setIsCancelling(false);
      setIsConfirmCancelModalOpen(false);
    }
  }, [onCancelReview]);

  const handleCreateOrViewEntries = useCallback(() => {
    if (hasCreatedEntries) {
      setIsSummaryModalOpen(true);
      return;
    }

    void handleCreateEntries();
  }, [hasCreatedEntries, handleCreateEntries]);

  const handleViewAllMappings = useCallback(() => {
    setReviewMode('all');
  }, []);

  const handleEditMode = useCallback(() => {
    setReviewMode('single');
  }, []);

  const handleSelectEntryIndex = useCallback((index: number) => {
    setSelectedEntryIndex(index);
    setReviewMode('single');
  }, []);

  const handleCancelOrExitReview = useCallback(() => {
    if (hasCreatedEntries) {
      onExitReview();
      return;
    }

    setIsConfirmCancelModalOpen(true);
  }, [hasCreatedEntries, onExitReview]);

  const handleSummaryDone = useCallback(() => {
    setIsSummaryModalOpen(false);
  }, []);

  const documentTitle =
    payload.normalizedDocument.title ?? payload.documentTitle ?? 'Selected document';
  const title = `Create from document "${documentTitle}"`;

  return (
    <>
      <div ref={reviewHeaderRef}>
        <Layout.Header title="Preview">
          <Flex justifyContent="space-between" alignItems="center" marginTop="spacingS">
            <Heading marginBottom="none">{title}</Heading>
            <Button
              variant="transparent"
              size="small"
              onClick={handleCancelOrExitReview}
              aria-label={hasCreatedEntries ? 'Exit review' : 'Cancel review'}>
              {hasCreatedEntries ? 'Exit' : 'Cancel'}
            </Button>
          </Flex>
        </Layout.Header>
        <Splitter marginTop="spacingS" />
      </div>
      <Layout.Body>
        <Flex flexDirection="column" gap="spacingM" style={{ padding: tokens.spacingL }}>
          <OverviewSection
            payload={reviewPayload}
            selectedEntryIndex={reviewMode === 'all' ? null : selectedEntryIndex}
            onSelectEntryIndex={handleSelectEntryIndex}
            onViewAllMappings={handleViewAllMappings}
            onEditMode={handleEditMode}
            isViewingAllMappings={reviewMode === 'all'}
            canEditMappings={!hasCreatedEntries}
            ctaLabel={hasCreatedEntries ? 'View entries' : 'Create entries'}
            onCtaClick={handleCreateOrViewEntries}
            isCtaLoading={isCreatePending}
          />
          <MappingView
            payload={reviewPayload}
            entryBlockGraph={entryBlockGraph}
            onEntryBlockGraphChange={setEntryBlockGraph}
            selectedEntryIndex={reviewMode === 'all' ? null : selectedEntryIndex}
            isDisabled={isMappingDisabled}
            occludingTopRef={reviewHeaderRef}
            reviewMode={reviewMode}
          />
        </Flex>
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={() => void handleConfirmCancel()}
        onCancel={() => !isCancelling && setIsConfirmCancelModalOpen(false)}
      />
      <SummaryModal
        isOpen={isSummaryModalOpen}
        sdk={sdk}
        entries={createdEntries ?? []}
        contentTypeDisplayInfoMap={contentTypeDisplayInfoMap}
        defaultLocale={sdk.locales.default}
        onDone={handleSummaryDone}
      />
      <ErrorModal
        isOpen={createError !== null}
        title="Failed to create entries"
        message={createError ?? ''}
        onClose={() => setCreateError(null)}
      />
    </>
  );
};
