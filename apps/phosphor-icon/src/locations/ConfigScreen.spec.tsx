import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import ConfigScreen from './ConfigScreen';
import type { AppInstallationParameters } from '../types/parameters';
import { createMockConfigSdk } from '../../test/mocks/mockSdk';

let mockSdk: ConfigAppSDK<AppInstallationParameters> & {
  __invokeConfigure: () => Promise<unknown>;
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ConfigScreen', () => {
  beforeEach(() => {
    mockSdk = createMockConfigSdk({
      contentTypes: [
        {
          name: 'Article',
          sys: { id: 'article' },
          fields: [],
        },
      ],
    }) as ConfigAppSDK<AppInstallationParameters> & {
      __invokeConfigure: () => Promise<unknown>;
    };
  });

  it('renders the marketplace-style setup sections', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set up Phosphor Icon')).toBeInTheDocument();
    });

    expect(screen.getByText('Assign content types')).toBeInTheDocument();
    expect(screen.getByText('Set up rules')).toBeInTheDocument();
    expect(screen.getByText('Limit available icons')).toBeInTheDocument();
  });

  it('loads saved configuration values including duotone and specific icons', async () => {
    mockSdk = createMockConfigSdk({
      parameters: {
        enabledWeights: JSON.stringify(['regular', 'duotone']),
        selectedContentTypeIds: ['article'],
        iconAvailabilityMode: 'specific',
        selectedIconNames: JSON.stringify(['airplane', 'anchor']),
        positionOptions: JSON.stringify(['start', 'end', 'top']),
      },
      contentTypes: [
        {
          name: 'Article',
          sys: { id: 'article' },
          fields: [],
        },
      ],
    }) as ConfigAppSDK<AppInstallationParameters> & {
      __invokeConfigure: () => Promise<unknown>;
    };

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /duotone/i })).toBeChecked();
    });

    expect(screen.getByText('start')).toBeInTheDocument();
    expect(screen.getByText('end')).toBeInTheDocument();
    expect(screen.getByText('top')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('supports large content type lists without truncating the dropdown options', async () => {
    mockSdk = createMockConfigSdk({
      contentTypes: Array.from({ length: 150 }, (_, index) => ({
        name: `Content Type ${index + 1}`,
        sys: { id: `content-type-${index + 1}` },
        fields: [],
      })),
    }) as ConfigAppSDK<AppInstallationParameters> & {
      __invokeConfigure: () => Promise<unknown>;
    };

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /select one or more/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /select one or more/i }));

    await waitFor(() => {
      expect(screen.getByText('Content Type 150')).toBeInTheDocument();
    });
  });

  it('returns the expected parameters from onConfigure', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /select one or more/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /select one or more/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search content types')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Article' }));

    fireEvent.click(screen.getByRole('checkbox', { name: /duotone/i }));
    fireEvent.change(screen.getByPlaceholderText('Add position option...'), {
      target: { value: 'top' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    const result = (await mockSdk.__invokeConfigure()) as {
      parameters: AppInstallationParameters;
      targetState: { EditorInterface: Record<string, { controls?: Array<{ fieldId: string }> }> };
    };

    expect(result.parameters).toMatchObject({
      iconAvailabilityMode: 'all',
      selectedContentTypeIds: ['article'],
      managedFieldId: 'phosphorIcon',
      managedFieldName: 'Phosphor icon',
      enabledWeights: JSON.stringify(['regular', 'duotone']),
      positionOptions: JSON.stringify(['start', 'end', 'top']),
    });
    expect(result.targetState.EditorInterface.article.controls).toHaveLength(1);
  });
});
