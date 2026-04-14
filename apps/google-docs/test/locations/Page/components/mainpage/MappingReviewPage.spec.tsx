import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Layout } from '@contentful/f36-components';
import { MappingReviewPage } from '../../../../../src/locations/Page/components/mainpage/MappingReviewPage';
import type { MappingReviewSuspendPayload } from '@types';

const payload: MappingReviewSuspendPayload = {
  suspendStepId: 'mapping-review',
  documentId: 'doc-1',
  documentTitle: 'My doc',
  normalizedDocument: {
    documentId: 'doc-1',
    title: 'My doc',
    designValues: [],
    contentBlocks: [],
    images: [],
    tables: [],
    assets: [],
  },
  entryBlockGraph: {
    entries: [],
    excludedSourceRefs: [],
  },
  referenceGraph: {
    edges: [],
    creationOrder: [],
    deferredFields: [],
    hasCircularDependency: false,
  },
  contentTypes: [],
};

describe('MappingReviewPage', () => {
  const renderPage = (onCancelReview: () => Promise<void>) =>
    render(
      <Layout>
        <MappingReviewPage payload={payload} onCancelReview={onCancelReview} />
      </Layout>
    );

  it('calls onCancelReview when cancellation is confirmed', async () => {
    const onCancelReview = vi.fn().mockResolvedValue(undefined);
    renderPage(onCancelReview);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel without creating' }));

    await waitFor(() => {
      expect(onCancelReview).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onCancelReview when user keeps creating', async () => {
    const onCancelReview = vi.fn().mockResolvedValue(undefined);
    renderPage(onCancelReview);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep creating' }));

    await waitFor(() => {
      expect(onCancelReview).not.toHaveBeenCalled();
    });
  });
});
