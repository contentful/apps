import { useState } from 'react';
import { Button, Flex, Heading, Layout, Note, Paragraph } from '@contentful/f36-components';
import Splitter from './Splitter';
import { PreviewPayload } from '@types';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { loadGoogleDocsReviewFixture } from '../../../../fixtures/googleDocsReview';
import { GoogleDocsMappingReviewScreen } from '../review-prototype/GoogleDocsMappingReviewScreen';

type PreviewPageViewProps =
  | {
      mode: 'workflow';
      payload: PreviewPayload;
      onCancel: () => void;
    }
  | {
      mode: 'fixture';
      onCancel: () => void;
    };

export const PreviewPageView = (props: PreviewPageViewProps) => {
  const isFixtureMode = props.mode === 'fixture';

  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const fixture = isFixtureMode ? loadGoogleDocsReviewFixture() : null;
  const title = isFixtureMode
    ? 'Create from fixture preview'
    : `Create from document "${props.payload.normalizedDocument?.title ?? 'Selected document'}"`;

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
        {isFixtureMode ? (
          fixture ? (
            <GoogleDocsMappingReviewScreen fixture={fixture} showChrome={false} />
          ) : (
            <Note
              variant="warning"
              title="Fixture not found or invalid"
              style={{ margin: '16px', maxWidth: 900 }}>
              <Paragraph marginBottom="none">
                Copy `debug-review-payload-latest.json` from `agents-api` into
                `src/fixtures/googleDocsReview/fixture.json` and reload the app.
              </Paragraph>
            </Note>
          )
        ) : (
          <Paragraph>Preview</Paragraph>
        )}
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={props.onCancel}
        onCancel={() => setIsConfirmCancelModalOpen(false)}
      />
    </>
  );
};
