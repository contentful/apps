import { useEffect, useMemo, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Heading, Layout, Note, Paragraph } from '@contentful/f36-components';
import Splitter from './Splitter';
import { MappingReviewSuspendPayload, PreviewPayload, ResumePayload } from '@types';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import {
  GoogleDocsReviewData,
  loadGoogleDocsReviewData,
} from '../../../../fixtures/googleDocsReview';
import { GoogleDocsMappingReviewScreen } from '../review-prototype/GoogleDocsMappingReviewScreen';
import OverviewSection from '../overview/OverviewSection';

interface PreviewPageViewProps {
  payload: PreviewPayload;
  oauthToken: string;
  onLeavePreview: () => void;
}

export const PreviewPageView = ({ payload, oauthToken, onLeavePreview }: PreviewPageViewProps) => {
  const sdk = useSDK<PageAppSDK>();
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const fixture = isFixtureMode ? loadGoogleDocsReviewData() : null;
  const reviewFixture = useMemo(() => {
    if (isFixtureMode) {
      return fixture;
    }

    if (props.mode === 'workflow') {
      return buildFixtureFromCompletedPayload(props.payload);
    }

    return buildFixtureFromMappingReviewPayload(props.payload);
  }, [fixture, isFixtureMode, props]);

  useEffect(() => {
    if (!reviewFixture) {
      console.warn(
        '[google-docs][preview]',
        'Fixture review screen could not be rendered because no valid fixture was loaded.'
      );
      return;
    }

    console.log('[google-docs][preview]', 'Resolved preview fixture state...', {
      mode: props.mode,
      entryCount: reviewFixture.entries.length,
      assetCount: reviewFixture.assets.length,
      contentBlockCount: reviewFixture.originalNormalizedDocument.contentBlocks.length,
      tableCount: reviewFixture.originalNormalizedDocument.tables.length,
      graphEntryCount: reviewFixture.entryBlockGraph.entries.length,
    });
  }, [props.mode, reviewFixture]);

  const title = isFixtureMode
    ? 'Create from fixture preview'
    : isMappingReviewMode
    ? `Review document "${
        props.payload.documentTitle ??
        props.payload.normalizedDocument.title ??
        props.payload.documentId
      }"`
    : `Create from document "${props.payload.normalizedDocument?.title ?? 'Selected document'}"`;

  const handleContinue = async () => {
    if (props.mode !== 'mappingReview' || isContinuing) {
      return;
    }

    const resumePayload = {
      editedNormalizedDocument:
        reviewFixture?.editableNormalizedDocument ?? props.payload.normalizedDocument,
      entryBlockGraph: reviewFixture?.entryBlockGraph ?? props.payload.entryBlockGraph,
    };

    console.log('[google-docs][preview]', 'Continuing mapping review with current graph state.', {
      contentBlockCount: resumePayload.editedNormalizedDocument.contentBlocks.length,
      tableCount: resumePayload.editedNormalizedDocument.tables.length,
      graphEntryCount: resumePayload.entryBlockGraph.entries.length,
    });

    setIsContinuing(true);
    try {
      await props.onContinue(resumePayload);
    } finally {
      setIsContinuing(false);
    }
  };

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
        {fixture ? <GoogleDocsMappingReviewScreen fixture={fixture} /> : null}
        <Flex flexDirection="column" gap="spacing2Xl">
          <OverviewSection
            sdk={sdk}
            payload={payload || fixture}
            payload={payload}
            oauthToken={oauthToken}
            onReturnToMainPage={onLeavePreview}
          />
          <Heading as="h2" marginBottom="none">
            Document outline
          </Heading>
        </Flex>
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={props.onCancel}
        onCancel={() => setIsConfirmCancelModalOpen(false)}
      />
    </>
  );
};
