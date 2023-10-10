import ConfigPage from './ConfigPage';
import { describe, expect, it, vi } from 'vitest';
import { Sections } from '@components/config/configText';
import { render, screen } from '@testing-library/react';
import { mockCma, MockSdk } from '../../../../test/mocks';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('ConfigPage component', () => {
  it('renders the correct sections', async () => {
    render(<ConfigPage />);

    const configTitle = screen.getByText(Sections.configHeading);
    const brandTitle = screen.getByText(Sections.brandHeading);
    const sidebarTitle = screen.getByText(Sections.addToSidebarHeading);

    expect(configTitle).toBeTruthy();
    expect(brandTitle).toBeTruthy();
    expect(sidebarTitle).toBeTruthy();
  });
});
