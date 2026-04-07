import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Layout } from '@contentful/f36-components';
import { describe, expect, it, vi } from 'vitest';

import { PreviewPageView } from '../../../../../src/locations/Page/components/mainpage/PreviewPageView';

const loadGoogleDocsReviewFixture = vi.fn();

vi.mock('../../../../../src/fixtures/googleDocsReview', () => ({
  loadGoogleDocsReviewFixture: () => loadGoogleDocsReviewFixture(),
}));

vi.mock(
  '../../../../../src/locations/Page/components/review-prototype/GoogleDocsMappingReviewScreen',
  () => ({
    GoogleDocsMappingReviewScreen: () => <div>Mock mapping review</div>,
  })
);

describe('PreviewPageView', () => {
  const renderInLayout = (element: React.ReactElement) =>
    render(
      <Layout withBoxShadow={true} offsetTop={10}>
        {element}
      </Layout>
    );

  it('renders the fixture review screen inside the preview layout', async () => {
    loadGoogleDocsReviewFixture.mockReturnValue({
      entries: [],
      assets: [],
      originalNormalizedDocument: { contentBlocks: [], tables: [] },
      editableNormalizedDocument: { contentBlocks: [], tables: [] },
      entryBlockGraph: { entries: [], excludedSourceRefs: [] },
    });

    renderInLayout(<PreviewPageView mode="fixture" onCancel={vi.fn()} />);

    expect(screen.getByText('Create from fixture preview')).toBeTruthy();
    expect(screen.getByText('Mock mapping review')).toBeTruthy();
  });

  it('shows fixture guidance when no review fixture is available', async () => {
    loadGoogleDocsReviewFixture.mockReturnValue(null);

    renderInLayout(<PreviewPageView mode="fixture" onCancel={vi.fn()} />);

    expect(screen.getByText('Fixture not found or invalid')).toBeTruthy();
    expect(screen.getByText(/debug-review-payload-latest\.json/i)).toBeTruthy();
  });

  it('uses the standard preview cancel flow in fixture mode', async () => {
    loadGoogleDocsReviewFixture.mockReturnValue({
      entries: [],
      assets: [],
      originalNormalizedDocument: { contentBlocks: [], tables: [] },
      editableNormalizedDocument: { contentBlocks: [], tables: [] },
      entryBlockGraph: { entries: [], excludedSourceRefs: [] },
    });

    const onCancel = vi.fn();
    renderInLayout(<PreviewPageView mode="fixture" onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel preview' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: "You're about to lose your progress" })
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel without creating' }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
