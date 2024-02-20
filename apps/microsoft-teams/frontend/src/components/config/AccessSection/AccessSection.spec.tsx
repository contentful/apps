import AccessSection from './AccessSection';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  mockMsalWithAccounts,
  mockMsalWithoutAccounts,
  mockParameters,
  mockSdk,
} from '@test/mocks';
import { accessSection } from '@constants/configCopy';

const mocks = vi.hoisted(() => {
  return { useMsal: vi.fn() };
});

vi.mock('@azure/msal-react', () => ({
  useMsal: mocks.useMsal,
}));

vi.mock('@hooks/useCustomApi', () => ({
  useCustomApi: vi.fn(),
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('AccessSection component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays correct copy when unathorized', () => {
    mocks.useMsal.mockReturnValue(mockMsalWithoutAccounts);
    const { unmount } = render(
      <AccessSection dispatch={vi.fn()} parameters={mockParameters} isAppInstalled={false} />
    );

    waitFor(() => expect(screen.getByText(accessSection.login)).toBeTruthy());
    unmount();
  });

  it('displays correct copy when authorized', async () => {
    mocks.useMsal.mockReturnValue(mockMsalWithAccounts);
    const { unmount } = render(
      <AccessSection dispatch={vi.fn()} parameters={mockParameters} isAppInstalled={true} />
    );

    waitFor(() => expect(screen.getByText(accessSection.teamsAppLink)).toBeTruthy());
    unmount();
  });
});
