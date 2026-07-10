import React from 'react';
import ConfigScreen from './ConfigScreen';
import { render, screen, fireEvent, configure, act, waitFor } from '@testing-library/react';
import { mockSdk } from '../test/mocks';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { vi } from 'vitest';

configure({ testIdAttribute: 'data-test-id' });

vi.mock('../functions/getVideos', () => ({
  fetchProjects: vi.fn().mockResolvedValue([{ id: 1, hashedId: 'abc123', name: 'My Project' }]),
}));

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    await act(async () => {
      render(<ConfigScreen sdk={mockSdk as unknown as AppExtensionSDK} />);
    });

    await mockSdk.app.onConfigure.mock.calls[0][0];

    expect(screen.getByText('Wistia Videos App Configuration')).toBeInTheDocument();
  });
});

describe('Config inputs work', () => {
  it('bearer token input accepts typed text on first install (no saved token)', async () => {
    // getParameters returns null → simulates a fresh install with no saved token
    const freshInstallSdk = {
      ...mockSdk,
      app: {
        ...mockSdk.app,
        getParameters: vi.fn().mockResolvedValueOnce(null),
      },
    };

    await act(async () => {
      render(<ConfigScreen sdk={freshInstallSdk as unknown as AppExtensionSDK} />);
    });

    const input = screen.getByRole('textbox', { name: /wistia data api access bearer token/i });

    fireEvent.change(input, { target: { value: 'my-secret-token' } });

    expect(input).toHaveValue('my-secret-token');
  });

  it('pre-populates saved token on existing install', async () => {
    const existingInstallSdk = {
      ...mockSdk,
      app: {
        ...mockSdk.app,
        getParameters: vi.fn().mockResolvedValueOnce({
          apiBearerToken: 'saved-token-xyz',
          excludedProjects: [],
        }),
      },
    };

    await act(async () => {
      render(<ConfigScreen sdk={existingInstallSdk as unknown as AppExtensionSDK} />);
    });

    const input = screen.getByRole('textbox', { name: /wistia data api access bearer token/i });
    expect(input).toHaveValue('saved-token-xyz');
  });

  it('does not show validation error before user interaction', async () => {
    const freshInstallSdk = {
      ...mockSdk,
      app: {
        ...mockSdk.app,
        getParameters: vi.fn().mockResolvedValueOnce(null),
      },
    };

    await act(async () => {
      render(<ConfigScreen sdk={freshInstallSdk as unknown as AppExtensionSDK} />);
    });

    expect(screen.queryByText('Please, provide a bearer token value')).not.toBeInTheDocument();
  });

  it('shows validation error when submitting empty token', async () => {
    const freshInstallSdk = {
      ...mockSdk,
      app: {
        ...mockSdk.app,
        getParameters: vi.fn().mockResolvedValueOnce(null),
      },
    };

    await act(async () => {
      render(<ConfigScreen sdk={freshInstallSdk as unknown as AppExtensionSDK} />);
    });

    fireEvent.click(screen.getByRole('button', { name: /display wistia projects/i }));

    await waitFor(() => {
      expect(screen.getByText('Please, provide a bearer token value')).toBeInTheDocument();
    });
  });
});
