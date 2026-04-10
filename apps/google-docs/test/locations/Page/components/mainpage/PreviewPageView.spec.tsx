import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Layout } from '@contentful/f36-components';
import { describe, expect, it, vi } from 'vitest';
import type { MappingReviewSuspendPayload } from '@types';
import { PreviewPageView } from '../../../../../src/locations/Page/components/mainpage/PreviewPageView';

vi.mock('../../../../../src/locations/Page/components/review/DocumentOutline', () => ({
  DocumentOutline: ({ payload }: { payload: MappingReviewSuspendPayload }) => (
    <div>{`Mock mapping review ${payload.entryBlockGraph.entries.length}`}</div>
  ),
}));

const mappingReviewPayload: MappingReviewSuspendPayload = {
  suspendStepId: 'mapping-review',
  reason: 'Mapping review required before CMA payload generation continues',
  documentId: 'doc-1',
  documentTitle: 'Mapping review document',
  normalizedDocument: {
    documentId: 'doc-1',
    title: 'Mapping review document',
    contentBlocks: [],
    tables: [],
  },
  entryBlockGraph: {
    entries: [],
    excludedSourceRefs: [],
  },
  referenceGraph: {},
  contentTypes: [],
};

describe('PreviewPageView', () => {
  it('renders the mapping review screen without the overview action section', async () => {
    render(
      <Layout>
        <PreviewPageView
          payload={mappingReviewPayload}
          oauthToken="oauth-token"
          onLeavePreview={vi.fn()}
          onResumeMappingReview={vi.fn()}
        />
      </Layout>
    );

    expect(screen.getByRole('heading', { name: 'Review document "Mapping review document"' }));
    expect(screen.getByText('Mock mapping review 0')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Create selected entries' })).toBeNull();
  });

  it('keeps the cancel preview flow working', async () => {
    const onLeavePreview = vi.fn();

    render(
      <Layout>
        <PreviewPageView
          payload={mappingReviewPayload}
          oauthToken="oauth-token"
          onLeavePreview={onLeavePreview}
        />
      </Layout>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel preview' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: "You're about to lose your progress" })
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel without creating' }));

    await waitFor(() => {
      expect(onLeavePreview).toHaveBeenCalledTimes(1);
    });
  });
});
