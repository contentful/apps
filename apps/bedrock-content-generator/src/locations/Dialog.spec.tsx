import AppInstallationParameters from '@components/config/appInstallationParameters';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockSdk, generateRandomParameters, mockCma } from '../../test/mocks';
import Dialog from './Dialog';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Dialog component', () => {
  it('renders', () => {
    const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
    sdk.parameters.installation = generateRandomParameters();
    const { getByText } = render(<Dialog />);
    expect(getByText('Select a source field and output field to generate a title')).toBeTruthy();
  });
});
