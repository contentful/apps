import { act, render, screen } from '@testing-library/react';
import { mockSdk, mockCma } from '../../../test/mocks';
import GoogleAnalyticsConfigPage from 'components/config-screen/GoogleAnalyticsConfigPage';
import { config } from '../../../src/config';

const apiRoot = config.backendApiUrl;

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

export const apiPath = (path: string) => {
  return new URL(path, apiRoot).toString();
};

describe('Google Analytics Page', () => {
  it('renders setup view', async () => {
    await act(async () => {
      render(<GoogleAnalyticsConfigPage />);
    });

    await screen.findByText('API Access');
    await screen.findByText('Google Service Account Details');
  });
});
