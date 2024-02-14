import AccessSection from './AccessSection';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  mockMsalWithAccounts,
  mockMsalWithoutAccounts,
  mockParameters,
  mockSdk,
} from '@test/mocks';

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
    render(<AccessSection dispatch={vi.fn()} parameters={mockParameters} isAppInstalled={false} />);

    expect(screen.getByText('Connect to Teams')).toBeTruthy();
  });

  it('displays correct copy when authorized', async () => {
    mocks.useMsal.mockReturnValue(mockMsalWithAccounts);
    render(<AccessSection dispatch={vi.fn()} parameters={mockParameters} isAppInstalled={true} />);

    expect(screen.getByText('Disconnect')).toBeTruthy();
    expect(screen.getByText('username@companyabc.com')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Company ABC')).toBeTruthy());
    await waitFor(() => expect(screen.getByRole('img')).toBeTruthy());
  });
});
