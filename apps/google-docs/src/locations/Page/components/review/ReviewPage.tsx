import { useCallback, useMemo, useState } from 'react';
import { Button, Flex, Heading, Layout } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { MappingReviewSuspendPayload } from '@types';
import Splitter from '../mainpage/Splitter';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { OverviewPanel } from './overview/OverviewPanel';
import { buildOverviewEntries } from './overview/buildOverviewEntries';
import { MappingView } from './mapping/MappingView';

interface ReviewPageProps {
  payload: MappingReviewSuspendPayload;
  onCancelReview: () => Promise<void>;
}

export const ReviewPage = ({ payload, onCancelReview }: ReviewPageProps) => {
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const overviewEntries = useMemo(
    () => buildOverviewEntries(payload.entryBlockGraph.entries, payload.contentTypes),
    [payload.contentTypes, payload.entryBlockGraph.entries]
  );

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
        onConfirm={() => void handleConfirmCancel()}
        onCancel={() => !isCancelling && setIsConfirmCancelModalOpen(false)}
      />
    </>
  );
};
