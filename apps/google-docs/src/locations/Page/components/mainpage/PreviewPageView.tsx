import { useEffect, useMemo, useState } from 'react';
import { Button, Flex, Heading, Layout, Note, Paragraph } from '@contentful/f36-components';
import Splitter from './Splitter';
import { MappingReviewSuspendPayload, PreviewPayload, ResumePayload } from '@types';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import {
  GoogleDocsReviewData,
  loadGoogleDocsReviewData,
} from '../../../../fixtures/googleDocsReview';
import { GoogleDocsMappingReviewScreen } from '../review-prototype/GoogleDocsMappingReviewScreen';

type PreviewPageViewProps =
  | {
      mode: 'workflow';
      payload: PreviewPayload;
      onCancel: () => void;
    }
  | {
      mode: 'mappingReview';
      payload: MappingReviewSuspendPayload;
      onCancel: () => void;
      onContinue: (resumePayload: ResumePayload) => Promise<void> | void;
    }
  | {
      mode: 'fixture';
      onCancel: () => void;
    };

const buildFixtureFromCompletedPayload = (payload: PreviewPayload): GoogleDocsReviewData => ({
  entries: payload.entries,
  assets: payload.assets,
  referenceGraph: payload.referenceGraph,
  originalNormalizedDocument: payload.normalizedDocument,
  editableNormalizedDocument: structuredClone(payload.normalizedDocument),
  entryBlockGraph: payload.entryBlockGraph ?? {
    entries: [],
    excludedSourceRefs: [],
  },
});

const buildFixtureFromMappingReviewPayload = (
  payload: MappingReviewSuspendPayload
): GoogleDocsReviewData => ({
  entries: payload.entryBlockGraph.entries.map((entry) => {
    const contentType = payload.contentTypes.find(
      (candidate) => candidate.sys.id === entry.contentTypeId
    );
    const title = contentType?.name ?? entry.tempId ?? entry.contentTypeId;

    return {
      tempId: entry.tempId,
      contentTypeId: entry.contentTypeId,
      fields: {
        title: {
          'en-US': title,
        },
      },
    };
  }),
  assets: [],
  referenceGraph: payload.referenceGraph,
  originalNormalizedDocument: payload.normalizedDocument,
  editableNormalizedDocument: structuredClone(payload.normalizedDocument),
  entryBlockGraph: payload.entryBlockGraph,
});

export const PreviewPageView = (props: PreviewPageViewProps) => {
  const isFixtureMode = props.mode === 'fixture';
  const isMappingReviewMode = props.mode === 'mappingReview';

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
        {isFixtureMode ? (
          reviewFixture ? (
            <GoogleDocsMappingReviewScreen fixture={reviewFixture} showChrome={false} />
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
          <>
            {reviewFixture ? (
              <GoogleDocsMappingReviewScreen fixture={reviewFixture} showChrome={false} />
            ) : (
              <Paragraph>Preview</Paragraph>
            )}
            {isMappingReviewMode ? (
              <Flex justifyContent="flex-end" marginTop="spacingM">
                <Button onClick={handleContinue} isDisabled={isContinuing}>
                  Continue
                </Button>
              </Flex>
            ) : null}
          </>
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
