import AppInstallationParameters from '@components/config/appInstallationParameters';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockSdk, generateRandomParameters, mockCma } from '../../test/mocks';
import Sidebar from './Sidebar';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  it('renders', () => {
    const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
    sdk.parameters.installation = generateRandomParameters();
    const { getByText } = render(<Sidebar />);
    expect(getByText('Rewrite')).toBeTruthy();
  });
});
