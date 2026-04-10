import { useState } from 'react';
import { Button, Flex, Heading, Layout, Paragraph } from '@contentful/f36-components';
import type { MappingReviewSuspendPayload, PreviewPayload } from '@types';
import Splitter from './Splitter';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { DocumentOutline } from '../review/DocumentOutline';
import { isMappingReviewSuspendPayload } from '../../../../utils/utils';

interface PreviewPageViewProps {
  payload: PreviewPayload | MappingReviewSuspendPayload;
  oauthToken: string;
  onLeavePreview: () => void;
  onResumeMappingReview?: () => Promise<void>;
}

function hasEntryBlockGraph(
  payload: PreviewPayload | MappingReviewSuspendPayload
): payload is
  | MappingReviewSuspendPayload
  | (PreviewPayload & { entryBlockGraph: NonNullable<PreviewPayload['entryBlockGraph']> }) {
  return Boolean(payload.entryBlockGraph);
}

export const PreviewPageView = ({ payload, onLeavePreview }: PreviewPageViewProps) => {
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const isMappingReviewMode = isMappingReviewSuspendPayload(payload);

  const title = `Create from document "${payload.normalizedDocument.title ?? 'Selected document'}"`;

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
        {/* TODO: Restore OverviewSection once it is compatible with EntryBlockGraph-based preview payloads. */}
        {hasEntryBlockGraph(payload) ? (
          <DocumentOutline payload={payload} showChrome={false} />
        ) : (
          <Paragraph marginBottom="none">
            Preview overview is temporarily unavailable until the preview payload is compatible with
            EntryBlockGraph.
          </Paragraph>
        )}
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={onLeavePreview}
        onCancel={() => setIsConfirmCancelModalOpen(false)}
      />
    </>
  );
};
