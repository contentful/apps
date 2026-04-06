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
        managedFieldName: 'Custom icon field',
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
    expect(screen.getByDisplayValue('Custom icon field')).toBeInTheDocument();
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
    fireEvent.change(screen.getByRole('textbox', { name: 'Field name' }), {
      target: { value: 'Marketing icon' },
    });

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
      managedFieldId: 'marketingIcon',
      managedFieldName: 'Marketing icon',
      enabledWeights: JSON.stringify(['regular', 'duotone']),
      positionOptions: JSON.stringify(['start', 'end', 'top']),
    });
    expect(result.targetState.EditorInterface.article.controls).toHaveLength(1);
  });

  it('renames the managed field to match the configured field name', async () => {
    mockSdk = createMockConfigSdk({
      parameters: {
        enabledWeights: JSON.stringify(['regular']),
        selectedContentTypeIds: ['article'],
        managedFieldId: 'phosphorIcon',
        managedFieldName: 'Phosphor icon',
      },
      contentTypes: [
        {
          name: 'Article',
          sys: { id: 'article' },
          fields: [{ id: 'phosphorIcon', name: 'Phosphor icon', type: 'Object' }],
        },
      ],
      editorInterfaces: {
        article: {
          controls: [
            {
              fieldId: 'phosphorIcon',
              widgetId: 'test-app-id',
              widgetNamespace: 'app',
            },
          ],
          sys: { version: 1 },
        },
      },
    }) as ConfigAppSDK<AppInstallationParameters> & {
      __invokeConfigure: () => Promise<unknown>;
    };

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Field name' })).toHaveValue('Phosphor icon');
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Field name' }), {
      target: { value: 'App Icon' },
    });

    await mockSdk.__invokeConfigure();

    const updatedContentType = await mockSdk.cma.contentType.get({ contentTypeId: 'article' });
    expect(updatedContentType.fields).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'phosphorIcon', name: 'App Icon' })])
    );
  });

  it('warns when existing entries use disabled styles and can migrate them', async () => {
    mockSdk = createMockConfigSdk({
      parameters: {
        enabledWeights: JSON.stringify(['regular']),
        selectedContentTypeIds: ['article'],
        managedFieldId: 'phosphorIcon',
        managedFieldName: 'Phosphor icon',
      },
      contentTypes: [
        {
          name: 'Article',
          sys: { id: 'article' },
          fields: [{ id: 'phosphorIcon', name: 'Phosphor icon', type: 'Object' }],
        },
      ],
      entries: [
        {
          sys: { id: 'entry-1', contentTypeId: 'article', publishedVersion: 1 },
          fields: {
            phosphorIcon: {
              'en-US': {
                name: 'alien',
                componentName: 'Alien',
                weight: 'duotone',
                position: 'start',
              },
            },
          },
        },
      ],
      editorInterfaces: {
        article: {
          controls: [
            {
              fieldId: 'phosphorIcon',
              widgetId: 'test-app-id',
              widgetNamespace: 'app',
            },
          ],
          sys: { version: 1 },
        },
      },
    }) as ConfigAppSDK<AppInstallationParameters> & {
      __invokeConfigure: () => Promise<unknown>;
    };

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText(/existing entries use disabled styles/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/1 field value\(s\) currently use duotone/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /apply an allowed style to existing entries that use disabled styles/i,
      })
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Replacement style' })).toBeInTheDocument();
    });

    await mockSdk.__invokeConfigure();

    const updatedEntries = await mockSdk.cma.entry.getMany({
      query: { content_type: 'article', limit: 100, skip: 0 },
    });

    expect(updatedEntries.items[0].fields.phosphorIcon['en-US']).toEqual(
      expect.objectContaining({ weight: 'regular' })
    );
  });
});
