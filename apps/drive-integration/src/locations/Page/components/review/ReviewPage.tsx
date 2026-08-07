import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Flex, Heading, IconButton, Layout, Menu } from '@contentful/f36-components';
import { DotsThreeIcon, EyeIcon, PencilSimpleIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { PageAppSDK } from '@contentful/app-sdk';
import { cx } from '@emotion/css';
import type { EntryProps } from 'contentful-management';
import type { EntryBlockGraph, MappingReviewSuspendPayload, ReviewedReferenceGraph } from '@types';
import { RunStatus } from '@types';
import { resumeAndPollWorkflow } from '../../../../services/workflowService';
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
  modeToggleButton,
  modeToggleButtonActive,
  modeToggleWrapper,
  reviewHeaderActions,
} from './ReviewPage.styles';

interface ReviewPageProps {
  sdk: PageAppSDK;
  payload: MappingReviewSuspendPayload;
  runId?: string;
  onCancelReview: (graph: EntryBlockGraph) => Promise<void>;
  onExitReview: () => void;
  onRunCompleted?: (entryIds: string[]) => void;
}

export const ReviewPage = ({
  sdk,
  payload,
  runId,
  onCancelReview,
  onExitReview,
  onRunCompleted,
}: ReviewPageProps) => {
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [reviewMode, setReviewMode] = useState<'view' | 'edit'>('view');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [createdEntries, setCreatedEntries] = useState<EntryProps[] | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [blockFindingsAcknowledged, setBlockFindingsAcknowledged] = useState(false);
  const [entryBlockGraph, setEntryBlockGraph] = useState<EntryBlockGraph>(() =>
    structuredClone(payload.entryBlockGraph)
  );
  const [referenceGraph, setReferenceGraph] = useState<ReviewedReferenceGraph>(() =>
    structuredClone(payload.referenceGraph)
  );
  const [selectedEntryKeys, setSelectedEntryKeys] = useState<Set<string>>(() =>
    getAllEntrySelectionKeys(payload.entryBlockGraph.entries)
  );

  // Reset local graphs when starting a different run; do not depend on payload fields
  // alone or user edits would be wiped when the parent re-renders with a new object reference.
  useEffect(() => {
    const nextEntryBlockGraph = structuredClone(payload.entryBlockGraph);
    setEntryBlockGraph(nextEntryBlockGraph);
    setReferenceGraph(structuredClone(payload.referenceGraph));
    setSelectedEntryKeys(getAllEntrySelectionKeys(nextEntryBlockGraph.entries));
    setBlockFindingsAcknowledged(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-init on run identity
  }, [runId, payload.documentId]);

  const reviewPayload = useMemo(
    (): MappingReviewSuspendPayload => ({ ...payload, entryBlockGraph, referenceGraph }),
    [payload, entryBlockGraph, referenceGraph]
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
  const hasBlockFindings = (payload.validationFindings ?? []).some((f) => f.severity === 'block');
  const selectedEntryCount = useMemo(
    () => countSelectedEntries(entryBlockGraph.entries, selectedEntryKeys),
    [entryBlockGraph.entries, selectedEntryKeys]
  );
  const hasSelectedEntries = selectedEntryCount > 0;

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
      const result = await resumeAndPollWorkflow(sdk, runId, {
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

        const entryIds = entries.map((e) => e.sys.id);
        onRunCompleted?.(entryIds);
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
    sdk,
    onExitReview,
    onRunCompleted,
  ]);

  const handleConfirmCancel = useCallback(async () => {
    setIsCancelling(true);

    try {
      await onCancelReview(entryBlockGraph);
    } finally {
      setIsCancelling(false);
      setIsConfirmCancelModalOpen(false);
    }
  }, [onCancelReview, entryBlockGraph]);

  const handleCreateOrViewEntries = useCallback(() => {
    if (hasCreatedEntries) {
      setIsSummaryModalOpen(true);
      return;
    }

    void handleCreateEntries();
  }, [hasCreatedEntries, handleCreateEntries]);

  const handleDeleteJob = useCallback(() => {
    setIsConfirmCancelModalOpen(true);
  }, []);

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
      const assignedChildTempIds = new Set((referenceGraph.edges ?? []).map((e) => e.to));
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
              <Button
                variant="transparent"
                size="small"
                className={cx(modeToggleButton, reviewMode === 'view' && modeToggleButtonActive)}
                onClick={() => handleReviewModeChange('view')}
                aria-pressed={reviewMode === 'view'}
                startIcon={<EyeIcon />}>
                View only
              </Button>
              <Button
                variant="transparent"
                size="small"
                className={cx(modeToggleButton, reviewMode === 'edit' && modeToggleButtonActive)}
                onClick={() => handleReviewModeChange('edit')}
                aria-pressed={reviewMode === 'edit'}
                startIcon={<PencilSimpleIcon />}>
                Edit mode
              </Button>
            </div>
            {!hasCreatedEntries && (
              <Menu>
                <Menu.Trigger>
                  <IconButton
                    variant="secondary"
                    size="small"
                    aria-label="More actions"
                    icon={<DotsThreeIcon />}
                  />
                </Menu.Trigger>
                <Menu.List>
                  <Menu.Item onClick={handleDeleteJob} style={{ color: 'red' }}>
                    Delete
                  </Menu.Item>
                </Menu.List>
              </Menu>
            )}
            <Button
              variant="secondary"
              size="small"
              onClick={onExitReview}
              aria-label="Close review">
              Close
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
            isCtaDisabled={
              !hasCreatedEntries &&
              (!hasSelectedEntries || (hasBlockFindings && !blockFindingsAcknowledged))
            }
            areEntrySelectionsDisabled={isMappingDisabled}
            hasBlockFindings={hasBlockFindings}
            blockFindingsAcknowledged={blockFindingsAcknowledged}
            onBlockFindingsAcknowledged={setBlockFindingsAcknowledged}
          />
          <MappingView
            payload={reviewPayload}
            entryBlockGraph={entryBlockGraph}
            onEntryBlockGraphChange={setEntryBlockGraph}
            referenceGraph={referenceGraph}
            onReferenceGraphChange={setReferenceGraph}
            selectedEntryIndex={selectedEntryIndex}
            defaultLocale={sdk.locales.default}
            isDisabled={isMappingDisabled}
            mode={reviewMode}
          />
        </Flex>
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={() => void handleConfirmCancel()}
        onCancel={() => !isCancelling && setIsConfirmCancelModalOpen(false)}
        isConfirming={isCancelling}
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
