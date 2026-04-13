import { useState } from 'react';
import { Button, Flex, Heading, Layout, Paragraph } from '@contentful/f36-components';
import type { MappingReviewSuspendPayload } from '@types';
import Splitter from './Splitter';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { DocumentOutline } from '../review/DocumentOutline';
import { isMappingReviewSuspendPayload } from '../../../../utils/utils';

interface MappingReviewPageProps {
  payload: MappingReviewSuspendPayload;
  oauthToken: string;
  onLeaveReview: () => void;
  onResumeMappingReview?: () => Promise<void>;
}

export const MappingReviewPage = ({
  payload,
  onLeaveReview: onLeavePreview,
}: MappingReviewPageProps) => {
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);

  const isMappingReview = isMappingReviewSuspendPayload(payload);
  const documentTitle = payload.documentTitle || 'Selected document';
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
        {isMappingReview ? (
          <DocumentOutline payload={payload} />
        ) : (
          <Paragraph marginBottom="none">
            Standard preview is not available in this context.
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
