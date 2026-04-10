import { useState } from 'react';
import { Button, Flex, Heading, Layout, Note, Paragraph } from '@contentful/f36-components';
import Splitter from './Splitter';
import { MappingReviewSuspendPayload, PreviewPayload } from '@types';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { loadGoogleDocsReviewFixture } from '../../../../fixtures/googleDocsReview';
import { GoogleDocsMappingReviewScreen } from '../review-prototype/GoogleDocsMappingReviewScreen';
import Splitter from './Splitter';
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
        {fixture ? <GoogleDocsMappingReviewScreen fixture={fixture} /> : null}
        <Flex flexDirection="column" gap="spacing2Xl">
          <OverviewSection
            sdk={sdk}
            payload={payload || fixture}
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
