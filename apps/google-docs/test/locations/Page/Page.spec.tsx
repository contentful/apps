import Page from '../../../src/locations/Page/Page';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../mocks';
import { vi, describe, it, expect } from 'vitest';
import React, { useEffect } from 'react';

vi.mock('../../../src/locations/Page/components/mainpage/OAuthConnector', () => ({
  OAuthConnector: ({
    onOAuthConnectedChange,
    onOauthTokenChange,
    onLoadingStateChange,
  }: {
    onOAuthConnectedChange: (isConnected: boolean) => void;
    onOauthTokenChange: (token: string) => void;
    onLoadingStateChange: (isLoading: boolean) => void;
  }) => {
    useEffect(() => {
      onOAuthConnectedChange(true);
      onOauthTokenChange('mock-oauth-token');
      onLoadingStateChange(false);
    }, [onLoadingStateChange, onOAuthConnectedChange, onOauthTokenChange]);

    return <div>OAuth Connector</div>;
  },
}));

vi.mock('../../../src/locations/Page/components/mainpage/ModalOrchestrator', () => ({
  ModalOrchestrator: ({
    onReviewPayloadReady,
  }: {
    onReviewPayloadReady: (reviewPayload: Record<string, unknown>) => void;
  }) => (
    <button
      onClick={() =>
        onReviewPayloadReady({
          documentTitle: 'Test doc',
          reviewSummary: 'Review completed',
          entries: [],
          assets: [],
        })
      }>
      Complete review
    </button>
  ),
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Page component', () => {
  it('renders the Google Drive heading', async () => {
    const { getByRole } = render(<Page />);

    await waitFor(() => {
      expect(getByRole('heading', { name: 'Google Drive' })).toBeTruthy();
    });
  });

  it('renders the review page after the workflow provides review payload', async () => {
    const { getByRole, getByText } = render(<Page />);

    await waitFor(() => {
      expect(getByRole('button', { name: 'Complete review' })).toBeTruthy();
    });

    fireEvent.click(getByRole('button', { name: 'Complete review' }));

    await waitFor(() => {
      expect(getByRole('heading', { name: 'Review your document mappings' })).toBeTruthy();
      expect(getByText(/"reviewSummary": "Review completed"/)).toBeTruthy();
    });
  });
});
