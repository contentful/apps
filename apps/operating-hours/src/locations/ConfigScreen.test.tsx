import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import ConfigScreen from './ConfigScreen';
import { createMockConfigSdk } from '../test/mocks/mockSdk';
import { mockDefaultHours } from '../test/mocks/mockHours';

let mockSdk: ConfigAppSDK;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ConfigScreen', () => {
  beforeEach(() => {
    mockSdk = createMockConfigSdk({
      parameters: {
        clockFormat: '24h',
        selectedContentTypeIds: ['store'],
        useCustomDefaults: true,
        defaultHours: mockDefaultHours,
        managedFieldId: 'storeHours',
        managedFieldName: 'Operating hours',
      },
      contentTypes: [
        {
          name: 'Store',
          sys: { id: 'store' },
          fields: [
            { id: 'hours', name: 'Hours', type: 'Object' },
            { id: 'title', name: 'Title', type: 'Symbol' },
          ],
        },
        {
          name: 'Article',
          sys: { id: 'article' },
          fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
        },
      ],
      editorInterfaces: {
        store: {
          controls: [],
        },
        article: {
          controls: [],
        },
      },
    });
  });

  it('loads JSON fields and saved clock format', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set default hours before install')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Store').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /store/i }));
    expect(screen.getAllByText('Article').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('24-hour clock')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Operating hours')).toBeInTheDocument();
    expect(screen.getAllByRole('switch')[0]).toBeChecked();
  });

  it('rejects configure when no content type is selected', async () => {
    mockSdk = createMockConfigSdk({
      parameters: {
        clockFormat: '12h',
        selectedContentTypeIds: [],
        managedFieldName: 'Operating hours',
      },
      contentTypes: [
        {
          name: 'Store',
          sys: { id: 'store' },
          fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
        },
      ],
    });

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Content types')).toBeInTheDocument();
    });

    const result = await (
      mockSdk as ConfigAppSDK & {
        __invokeConfigure: () => Promise<unknown>;
      }
    ).__invokeConfigure();

    expect(result).toBe(false);
    expect(mockSdk.notifier.error).toHaveBeenCalled();
  });

  it('creates and assigns the managed JSON field during configure', async () => {
    mockSdk = createMockConfigSdk({
      parameters: {
        clockFormat: '12h',
        selectedContentTypeIds: ['article'],
        managedFieldName: 'Operating hours',
      },
      contentTypes: [
        {
          name: 'Article',
          sys: { id: 'article' },
          fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
        },
      ],
      editorInterfaces: {
        article: {
          controls: [],
        },
      },
    });

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Content types')).toBeInTheDocument();
    });

    const result = await (
      mockSdk as ConfigAppSDK & {
        __invokeConfigure: () => Promise<unknown>;
      }
    ).__invokeConfigure();

    expect(result).not.toBe(false);
    expect(mockSdk.cma.contentType.update).toHaveBeenCalled();
    expect(mockSdk.cma.editorInterface.update).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        targetState: {
          EditorInterface: {
            article: {
              controls: [{ fieldId: 'operatingHours' }],
            },
          },
        },
      })
    );
  });

  it('replaces an existing builtin control on the managed field', async () => {
    mockSdk = createMockConfigSdk({
      parameters: {
        clockFormat: '12h',
        selectedContentTypeIds: ['storeDetails'],
        managedFieldId: 'storeHours',
        managedFieldName: 'Operating hours',
      },
      contentTypes: [
        {
          name: 'Store Details',
          sys: { id: 'storeDetails' },
          fields: [
            { id: 'internalName', name: 'Internal name', type: 'Symbol' },
            { id: 'closingTime', name: 'Closing time', type: 'Object' },
            { id: 'storeHours', name: 'Operating hours', type: 'Object' },
          ],
        },
      ],
      editorInterfaces: {
        storeDetails: {
          controls: [
            {
              fieldId: 'internalName',
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            {
              fieldId: 'closingTime',
              widgetId: 'objectEditor',
              widgetNamespace: 'builtin',
            },
            {
              fieldId: 'storeHours',
              widgetId: 'objectEditor',
              widgetNamespace: 'builtin',
            },
          ],
        },
      },
    });

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Content types')).toBeInTheDocument();
    });

    const result = await (
      mockSdk as ConfigAppSDK & {
        __invokeConfigure: () => Promise<unknown>;
      }
    ).__invokeConfigure();

    expect(result).not.toBe(false);
    expect(mockSdk.cma.editorInterface.update).toHaveBeenCalledWith(
      { contentTypeId: 'storeDetails' },
      expect.objectContaining({
        controls: [
          {
            fieldId: 'internalName',
            widgetId: 'singleLine',
            widgetNamespace: 'builtin',
          },
          {
            fieldId: 'closingTime',
            widgetId: 'objectEditor',
            widgetNamespace: 'builtin',
          },
          {
            fieldId: 'storeHours',
            widgetId: 'test-app-id',
            widgetNamespace: 'app',
          },
        ],
      })
    );
  });
});
