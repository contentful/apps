import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { Layout } from '@contentful/f36-components';
import { MainPageView } from '../../../../../src/locations/Page/components/mainpage/MainPageView';

vi.mock('../../../../../src/locations/Page/components/mainpage/OAuthConnector', () => ({
  OAuthConnector: () => <div>Mock OAuth Connector</div>,
}));

const defaultProps = {
  oauthToken: 'test-token',
  isOAuthConnected: true,
  isOAuthLoading: false,
  isOAuthBusy: false,
  onConnectGoogleDrive: vi.fn(),
  onDisconnectGoogleDrive: vi.fn(),
  onSelectFile: vi.fn(),
};

const renderWithLayout = (ui: React.ReactElement) => render(<Layout>{ui}</Layout>);

describe('MainPageView', () => {
  it('shows file type guidance copy when connected', () => {
    renderWithLayout(<MainPageView {...defaultProps} />);

    expect(screen.getByText(/Only Google Doc files are supported/i)).toBeTruthy();
    expect(
      screen.getByText(/Sheets, Slides, and PDFs will not appear in the file picker/i)
    ).toBeTruthy();
  });

  it('shows the existing entries info note', () => {
    renderWithLayout(<MainPageView {...defaultProps} />);

    expect(screen.getByText(/This app only creates new entries\./i)).toBeTruthy();
  });

  it('shows warning note when not connected', () => {
    renderWithLayout(<MainPageView {...defaultProps} isOAuthConnected={false} oauthToken="" />);

    expect(
      screen.getByText(/Please connect to Drive before selecting your file\./i)
    ).toBeTruthy();
  });

  it('does not show warning note when connected', () => {
    renderWithLayout(<MainPageView {...defaultProps} />);

    expect(
      screen.queryByText(/Please connect to Drive before selecting your file\./i)
    ).toBeNull();
  });
});
