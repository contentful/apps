import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Flex, Heading, Layout } from '@contentful/f36-components';
import { EyeIcon, PencilSimpleIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { PageAppSDK } from '@contentful/app-sdk';
import { cx } from '@emotion/css';
import type { EntryProps } from 'contentful-management';
import type { EntryBlockGraph, MappingReviewSuspendPayload } from '@types';
import { RunStatus } from '@types';
import { useWorkflowAgent } from '@hooks/useWorkflowAgent';
import { createEntriesFromPreviewPayload } from '../../../../services/entryService';
import type { ContentTypeDisplayInfoMap } from '../../../../utils/overviewEntryList';
import {
  countSelectedEntries,
  filterEntryBlockGraphBySelection,
  getAllEntrySelectionKeys,
} from '../../../../utils/selectEntryBlockGraph';
import Splitter from '../mainpage/Splitter';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { ErrorModal } from '../modals/ErrorModal';
import { SummaryModal } from '../modals/SummaryModal';
import OverviewSection from '../overview/OverviewSection';
import { MappingView } from './mapping/MappingView';
import {
  cancelReviewButton,
  modeToggleButton,
  modeToggleButtonActive,
  modeToggleWrapper,
  reviewHeaderActions,
} from './ReviewPage.styles';

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
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [reviewMode, setReviewMode] = useState<'view' | 'edit'>('view');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [createdEntries, setCreatedEntries] = useState<EntryProps[] | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [entryBlockGraph, setEntryBlockGraph] = useState<EntryBlockGraph>(() =>
    structuredClone(payload.entryBlockGraph)
  );
  const [selectedEntryKeys, setSelectedEntryKeys] = useState<Set<string>>(() =>
    getAllEntrySelectionKeys(payload.entryBlockGraph.entries)
  );

  // Reset local graph when starting a different run; do not depend on payload.entryBlockGraph
  // alone or user edits would be wiped when the parent re-renders with a new object reference.
  useEffect(() => {
    const nextEntryBlockGraph = structuredClone(payload.entryBlockGraph);
    setEntryBlockGraph(nextEntryBlockGraph);
    setSelectedEntryKeys(getAllEntrySelectionKeys(nextEntryBlockGraph.entries));
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
  const selectedEntryCount = useMemo(
    () => countSelectedEntries(entryBlockGraph.entries, selectedEntryKeys),
    [entryBlockGraph.entries, selectedEntryKeys]
  );
  const hasSelectedEntries = selectedEntryCount > 0;

  const { resumeWorkflow } = useWorkflowAgent({ sdk, documentId: '', oauthToken: '' });

  const handleToggleEntrySelection = (entryKey: string, isSelected: boolean) => {
    setSelectedEntryKeys((previous) => {
      const next = new Set(previous);
      if (isSelected) {
        next.add(entryKey);
      } else {
        next.delete(entryKey);
      }
      return next;
    });
  };

  const handleCreateEntries = useCallback(async (): Promise<void> => {
    if (!runId) {
      onExitReview();
      return;
    }

    if (!hasSelectedEntries) {
      return;
    }

    setIsCreatePending(true);

    try {
      const selectedEntryBlockGraph = filterEntryBlockGraphBySelection(
        entryBlockGraph,
        selectedEntryKeys
      );
      const result = await resumeWorkflow(runId, {
        entryBlockGraph: selectedEntryBlockGraph,
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
  }, [
    runId,
    hasSelectedEntries,
    entryBlockGraph,
    selectedEntryKeys,
    resumeWorkflow,
    sdk,
    onExitReview,
  ]);

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

  const handleReviewModeChange = (mode: 'view' | 'edit') => {
    setReviewMode(mode);
    if (mode === 'view') {
      setSelectedEntryIndex(null);
    } else if (mode === 'edit' && selectedEntryIndex === null) {
      const assignedChildTempIds = new Set((payload.referenceGraph.edges ?? []).map((e) => e.to));
      const firstRootIndex = entryBlockGraph.entries.findIndex(
        (e) => !e.tempId || !assignedChildTempIds.has(e.tempId)
      );
      setSelectedEntryIndex(firstRootIndex >= 0 ? firstRootIndex : null);
    }
  };

  return (
    <>
      <Layout.Header title="Preview">
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingS">
          <Heading marginBottom="none">{title}</Heading>
          <Flex className={reviewHeaderActions}>
            <div className={modeToggleWrapper} role="group" aria-label="Review mode">
              <button
                type="button"
                className={cx(modeToggleButton, reviewMode === 'view' && modeToggleButtonActive)}
                onClick={() => handleReviewModeChange('view')}
                aria-pressed={reviewMode === 'view'}>
                <EyeIcon size="small" />
                View only
              </button>
              <button
                type="button"
                className={cx(modeToggleButton, reviewMode === 'edit' && modeToggleButtonActive)}
                onClick={() => handleReviewModeChange('edit')}
                aria-pressed={reviewMode === 'edit'}>
                <PencilSimpleIcon size="small" />
                Edit mode
              </button>
            </div>
            <Button
              variant="secondary"
              size="small"
              className={cancelReviewButton}
              onClick={handleCancelOrExitReview}
              aria-label={hasCreatedEntries ? 'Exit review' : 'Cancel review'}>
              {hasCreatedEntries ? 'Exit' : 'Cancel'}
            </Button>
          </Flex>
        </Flex>
      </Layout.Header>
      <Splitter marginTop="spacingS" />
      <Layout.Body>
        <Flex flexDirection="column" gap="spacingM" style={{ padding: tokens.spacingL }}>
          <OverviewSection
            payload={reviewPayload}
            selectedEntryIndex={selectedEntryIndex}
            selectedEntryKeys={selectedEntryKeys}
            onSelectEntryIndex={(index) => {
              setSelectedEntryIndex(index);
              setReviewMode('edit');
            }}
            onToggleEntrySelection={handleToggleEntrySelection}
            ctaLabel={hasCreatedEntries ? 'View entries' : 'Create selected entries'}
            onCtaClick={handleCreateOrViewEntries}
            isCtaLoading={isCreatePending}
            isCtaDisabled={!hasCreatedEntries && !hasSelectedEntries}
            areEntrySelectionsDisabled={isMappingDisabled}
          />
          <MappingView
            payload={reviewPayload}
            entryBlockGraph={entryBlockGraph}
            onEntryBlockGraphChange={setEntryBlockGraph}
            selectedEntryIndex={selectedEntryIndex}
            isDisabled={isMappingDisabled}
            mode={reviewMode}
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
        onClose={() => setCreateError(null)}
        config={{
          title: 'Failed to create entries',
          message: createError ?? '',
        }}
      />
    </>
  );
};
