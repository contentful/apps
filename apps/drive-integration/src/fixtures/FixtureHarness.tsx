import { Layout } from '@contentful/f36-components';
import type { PageAppSDK } from '@contentful/app-sdk';
import { ReviewPage } from '../locations/Page/components/review/ReviewPage';
import type { MappingReviewSuspendPayload } from '../types/workflow';
import fixtureData from './googleDocsReview/fixture.json';

const stubSdk = {
  locales: { default: 'en-US' },
} as unknown as PageAppSDK;

export const FixtureHarness = () => {
  return (
    <Layout>
      <ReviewPage
        sdk={stubSdk}
        payload={fixtureData as unknown as MappingReviewSuspendPayload}
        runId={undefined}
        onCancelReview={async () => {}}
        onExitReview={() => {}}
      />
    </Layout>
  );
};
