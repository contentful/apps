import { useMemo, useState } from 'react';
import { Button, Flex, Heading, Layout } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { ExcludeSelectionPayload, MappingReviewSuspendPayload } from '@types';
import Splitter from '../mainpage/Splitter';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { OverviewPanel } from './overview/OverviewPanel';
import { buildOverviewEntries } from './overview/buildOverviewEntries';
import { MappingView } from './mapping/MappingView';
import { EditionModal } from './mapping/edit-modals/EditionModal';
import { buildExcludeContentModalViewModel } from './mapping/edit-modals/utils/buildExcludeContentModalViewModel';

interface ReviewPageProps {
  payload: MappingReviewSuspendPayload;
  onLeaveReview: () => void;
}

const buildMockExcludeSelection = (): ExcludeSelectionPayload => ({
  selectedText: 'Sample selected content',
  locations: [
    {
      id: 'mock-summary',
      contentTypeId: 'sampleContentType',
      entryName: 'Sample entry',
      fieldId: 'summary',
      fieldName: 'Summary',
      fieldType: 'Text',
      sourceRef: {
        type: 'blockText',
        blockId: 'mock-block-1',
        start: 0,
        end: 23,
        flattenedRuns: [
          {
            start: 0,
            end: 23,
            text: 'Sample selected content',
            styles: {},
          },
        ],
      },
      isSelected: true,
    },
    {
      id: 'mock-description',
      contentTypeId: 'sampleContentType',
      entryName: 'Sample entry',
      fieldId: 'description',
      fieldName: 'Description',
      fieldType: 'Symbol',
      sourceRef: {
        type: 'blockText',
        blockId: 'mock-block-2',
        start: 0,
        end: 23,
        flattenedRuns: [
          {
            start: 0,
            end: 23,
            text: 'Sample selected content',
            styles: {},
          },
        ],
      },
    },
  ],
});

export const ReviewPage = ({ payload, onLeaveReview }: ReviewPageProps) => {
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [excludeSelection, setExcludeSelection] = useState<ExcludeSelectionPayload | null>(null);

  const documentTitle =
    payload.normalizedDocument.title ?? payload.documentTitle ?? 'Selected document';
  const title = `Create from document "${documentTitle}"`;

  const excludeContentViewModel = useMemo(
    () =>
      excludeSelection
        ? buildExcludeContentModalViewModel(excludeSelection, payload.contentTypes)
        : null,
    [excludeSelection, payload.contentTypes]
  );

  const handleCloseExcludeModal = () => {
    setExcludeSelection(null);
  };

  // TODO : Future preview-page highlight interactions should set the excludeSelection
  const handleExcludeSelection = (selection: ExcludeSelectionPayload) => {
    setExcludeSelection(selection);
  };

  const overviewEntries = useMemo(
    () => buildOverviewEntries(payload.entryBlockGraph.entries, payload.contentTypes),
    [payload.contentTypes, payload.entryBlockGraph.entries]
  );

  return (
    <>
      <Layout.Header title="Preview">
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingS">
          <Heading marginBottom="none">{title}</Heading>
          <Flex alignItems="center" gap="spacingS">
            <Button
              variant="secondary"
              size="small"
              onClick={() => handleExcludeSelection(buildMockExcludeSelection())}>
              Mock exclude modal
            </Button>
            <Button
              variant="transparent"
              size="small"
              onClick={() => setIsConfirmCancelModalOpen(true)}
              aria-label="Cancel preview">
              Cancel
            </Button>
          </Flex>
        </Flex>
      </Layout.Header>
      <Splitter marginTop="spacingS" />
      <Layout.Body>
        <Flex flexDirection="column" gap="spacingM" style={{ padding: tokens.spacingL }}>
          <OverviewPanel
            overviewEntries={overviewEntries}
            selectedEntryIndex={selectedEntryIndex}
            onSelectEntryIndex={setSelectedEntryIndex}
          />
          <MappingView payload={payload} selectedEntryIndex={selectedEntryIndex} />
        </Flex>
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={onLeaveReview}
        onCancel={() => setIsConfirmCancelModalOpen(false)}
      />
      {excludeContentViewModel ? (
        <EditionModal
          isOpen={true}
          onClose={handleCloseExcludeModal}
          viewModel={excludeContentViewModel}
          title="Exclude content"
          locationSectionDescription="This content is used in more than one place in the entry. Select which item to exclude."
          primaryButtonLabel="Exclude content"
        />
      ) : null}
    </>
  );
};
