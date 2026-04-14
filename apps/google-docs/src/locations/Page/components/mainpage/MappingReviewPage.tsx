import { useState } from 'react';
import { Button, Flex, Heading, Layout } from '@contentful/f36-components';
import type { MappingReviewSuspendPayload } from '@types';
import Splitter from './Splitter';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { DocumentOutline } from '../review/DocumentOutline';

interface MappingReviewPageProps {
  payload: MappingReviewSuspendPayload;
  onLeaveReview: () => void;
}

export const MappingReviewPage = ({ payload, onLeaveReview }: MappingReviewPageProps) => {
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);

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
        <DocumentOutline payload={payload} />
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={onLeaveReview}
        onCancel={() => setIsConfirmCancelModalOpen(false)}
      />
    </>
  );
};
