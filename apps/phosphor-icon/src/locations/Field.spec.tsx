import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FieldAppSDK } from '@contentful/app-sdk';
import Field from './Field';
import { createMockFieldSdk } from '../../test/mocks/mockSdk';

let mockSdk: FieldAppSDK;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Field', () => {
  beforeEach(() => {
    mockSdk = createMockFieldSdk();
  });

  it('opens the dialog with the latest installation parameters', async () => {
    const fieldSdk = createMockFieldSdk({
      installationParameters: {
        enabledWeights: JSON.stringify(['regular']),
        positionOptions: JSON.stringify(['start']),
        iconAvailabilityMode: 'all',
      },
      liveInstallationParameters: {
        enabledWeights: JSON.stringify(['bold', 'duotone']),
        positionOptions: JSON.stringify(['end', 'top']),
        iconAvailabilityMode: 'specific',
        selectedIconNames: JSON.stringify(['airplane', 'anchor']),
      },
    });
    fieldSdk.cma = {
      appInstallation: {
        get: vi.fn(() =>
          Promise.resolve({
            parameters: {
              enabledWeights: JSON.stringify(['bold', 'duotone']),
              positionOptions: JSON.stringify(['end', 'top']),
              iconAvailabilityMode: 'specific',
              selectedIconNames: JSON.stringify(['airplane', 'anchor']),
            },
          })
        ),
      },
    } as never;
    mockSdk = fieldSdk;

    render(<Field />);

    fireEvent.click(screen.getByRole('button', { name: /select icon/i }));

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: expect.objectContaining({
            enabledWeights: ['bold', 'duotone'],
            positionOptions: ['end', 'top'],
            allowedIconNames: ['airplane', 'anchor'],
          }),
        })
      );
    });
  });

  it('shows a warning when the saved style is no longer allowed by config', async () => {
    const fieldSdk = createMockFieldSdk({
      fieldValue: {
        name: 'alien',
        componentName: 'Alien',
        weight: 'duotone',
        position: 'start',
      },
      installationParameters: {
        enabledWeights: JSON.stringify(['regular']),
        positionOptions: JSON.stringify(['start']),
        iconAvailabilityMode: 'all',
      },
      liveInstallationParameters: {
        enabledWeights: JSON.stringify(['regular']),
        positionOptions: JSON.stringify(['start']),
        iconAvailabilityMode: 'all',
      },
    });
    fieldSdk.cma = {
      appInstallation: {
        get: vi.fn(() =>
          Promise.resolve({
            parameters: {
              enabledWeights: JSON.stringify(['regular']),
              positionOptions: JSON.stringify(['start']),
              iconAvailabilityMode: 'all',
            },
          })
        ),
      },
    } as never;
    mockSdk = fieldSdk;

    render(<Field />);

    expect(await screen.findByText(/selected style is no longer allowed/i)).toBeInTheDocument();
    expect(screen.getByText(/this entry currently uses duotone\./i)).toBeInTheDocument();
  });
});
