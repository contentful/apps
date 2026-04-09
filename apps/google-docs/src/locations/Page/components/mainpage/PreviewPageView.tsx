import { useState } from 'react';
import { Button, Flex, Heading, Layout } from '@contentful/f36-components';
import Splitter from './Splitter';
import { MappingReviewSuspendPayload, PreviewPayload } from '@types';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import OverviewSection from '../overview/OverviewSection';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { isMappingReviewSuspendPayload } from '../../../../utils/utils';

interface PreviewPageViewProps {
  payload: PreviewPayload | MappingReviewSuspendPayload;
  oauthToken: string;
  onLeavePreview: () => void;
  onResumeMappingReview?: () => Promise<void>;
}

export const PreviewPageView = ({
  payload,
  oauthToken,
  onLeavePreview,
  onResumeMappingReview,
}: PreviewPageViewProps) => {
  const sdk = useSDK<PageAppSDK>();
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const mappingReviewPayload = isMappingReviewSuspendPayload(payload) ? payload : null;
  const rawTitle = payload.normalizedDocument?.title;
  const docTitle = typeof rawTitle === 'string' ? rawTitle : undefined;
  const title = docTitle && docTitle.trim().length > 0 ? docTitle : 'Selected document';

  return (
    <>
      <Layout.Header title="Preview">
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingS">
          <Heading marginBottom="none">Create from document "{title}"</Heading>
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
        <Flex flexDirection="column" gap="spacing2Xl">
          <OverviewSection
            sdk={sdk}
            payload={payload}
            oauthToken={oauthToken}
            onReturnToMainPage={onLeavePreview}
            onCreateSelected={mappingReviewPayload ? onResumeMappingReview : undefined}
          />
          <Heading as="h2" marginBottom="none">
            Document outline
          </Heading>
        </Flex>
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={onLeavePreview}
        onCancel={() => setIsConfirmCancelModalOpen(false)}
      />
    </>
  );
};
