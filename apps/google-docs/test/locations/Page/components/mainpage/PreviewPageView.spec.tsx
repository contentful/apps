import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PageAppSDK } from '@contentful/app-sdk';
import { Layout } from '@contentful/f36-components';
import type { MappingReviewSuspendPayload } from '../../../../../src/types';
import { PreviewPageView } from '../../../../../src/locations/Page/components/mainpage/PreviewPageView';
import { createMockSDK } from '../../../../mocks';

const { mockUseSDK } = vi.hoisted(() => ({
  mockUseSDK: vi.fn(),
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockUseSDK(),
}));

describe('PreviewPageView', () => {
  let mockSdk: PageAppSDK;

  const mappingReviewPayload: MappingReviewSuspendPayload = {
    suspendStepId: 'mapping-review',
    documentId: 'doc-1',
    documentTitle: 'Mapping review document',
    normalizedDocument: {
      documentId: 'doc-1',
      title: 'Mapping review document',
      contentBlocks: [],
      tables: [],
    },
    entryBlockGraph: [],
    referenceGraph: {},
    contentTypes: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSDK() as PageAppSDK;
    mockUseSDK.mockReturnValue(mockSdk);
  });

  it('delegates create selected to the mapping review resume callback', async () => {
    const onResumeMappingReview = vi.fn().mockResolvedValue(undefined);

    render(
      <Layout>
        <PreviewPageView
          payload={mappingReviewPayload}
          oauthToken="oauth-token"
          onLeavePreview={vi.fn()}
          onResumeMappingReview={onResumeMappingReview}
        />
      </Layout>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Create from document "Mapping review document"' })
      ).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'Create selected entries' }).hasAttribute('disabled')
      ).toBe(false);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create selected entries' }));

    await waitFor(() => {
      expect(onResumeMappingReview).toHaveBeenCalledTimes(1);
    });
  });
});
