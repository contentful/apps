import { useState } from 'react';
import { Button, Flex, Heading, Layout, Note, Paragraph } from '@contentful/f36-components';
import Splitter from './Splitter';
import { PreviewPayload } from '../../../../utils/types';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { loadGoogleDocsReviewFixture } from '../../../../fixtures/googleDocsReview';
import { GoogleDocsMappingReviewScreen } from '../review-prototype/GoogleDocsMappingReviewScreen';

interface PreviewPageViewProps {
  payload: PreviewPayload;
  onCancel: () => void;
}

export const PreviewPageView = ({ payload, onCancel }: PreviewPageViewProps) => {
  const title = payload.documentTitle.trim() ? payload.documentTitle : 'Selected document';
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const fixture = loadGoogleDocsReviewFixture();

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
        {fixture ? (
          <GoogleDocsMappingReviewScreen fixture={fixture} />
        ) : (
          <Note variant="warning" title="Fixture not found or invalid">
            <Paragraph marginBottom="none">
              Copy a backend debug payload into `src/fixtures/googleDocsReview/fixture.json` and
              reload the app.
            </Paragraph>
          </Note>
        )}
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={onCancel}
        onCancel={() => setIsConfirmCancelModalOpen(false)}
      />
    </>
  );
};
