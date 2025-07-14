import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../../functions/appEventHandler';
import ConfigEntryService from '../../src/utils/ConfigEntryService';
import { RICH_TEXT_FIELD_TEMPLATE, TEXT_FIELD_TEMPLATE } from '../../functions/templates';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { BLOCKS, Document } from '@contentful/rich-text-types';
import * as common from '../../functions/common';

const mockCma = {
  entry: {
    get: vi.fn().mockResolvedValue({
      fields: {
        connectedFields: {
          'en-US': {
            'test-entry-id': [],
          },
        },
      },
    }),
    update: vi.fn(),
  },
};

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

vi.mock('../../functions/common', async () => {
  const actual = await vi.importActual<typeof import('../../functions/common')>(
    '../../functions/common'
  );
  return {
    ...actual,
    createModuleFile: vi.fn(),
    initContentfulManagementClient: vi.fn(), // <-- add this line
  };
});

describe('app event handler', () => {
  const mockContext = {
    appInstallationParameters: {
      hubspotAccessToken: 'test-api-key',
    },
    cmaClientOptions: {},
    spaceId: 'test-space',
    environmentId: 'test-env',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return early if entry is not tracked in config (no connected fields)', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': 'Entry.save',
      },
      body: {
        sys: {
          id: 'untracked-entry-id',
          contentType: { sys: { id: 'test-content-type' } },
        },
        fields: {},
      },
    };
    vi.spyOn(ConfigEntryService.prototype, 'getEntryConnectedFields').mockResolvedValue([]);
    const removeEntryConnectedFieldsMock = vi.spyOn(
      ConfigEntryService.prototype,
      'removeEntryConnectedFields'
    );
    const updateEntryConnectedFieldsMock = vi.spyOn(
      ConfigEntryService.prototype,
      'updateEntryConnectedFields'
    );
    vi.spyOn(common, 'initContentfulManagementClient').mockReturnValue({} as any);

    await handler(event as any, mockContext as any);

    expect(removeEntryConnectedFieldsMock).not.toHaveBeenCalled();
    expect(updateEntryConnectedFieldsMock).not.toHaveBeenCalled();
  });

  it('should remove the entry id from the config on entry deletion', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': ['Entry.delete'],
      },
      body: {
        sys: {
          id: 'test-entry-id',
        },
      },
    };

    const removeEntryConnectedFieldsMock = vi.spyOn(
      ConfigEntryService.prototype,
      'removeEntryConnectedFields'
    );

    vi.spyOn(common, 'initContentfulManagementClient').mockReturnValue(mockCma as any);

    await handler(event as any, mockContext as any);

    expect(removeEntryConnectedFieldsMock).toHaveBeenCalled();
    expect(removeEntryConnectedFieldsMock).toHaveBeenCalledWith(event.body.sys.id);
  });

  it('should update a module on entry save with text field', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': 'Entry.save',
      },
      body: {
        sys: {
          id: 'test-entry-id',
          contentType: { sys: { id: 'test-content-type' } },
        },
        fields: {
          textField: { 'en-US': 'Hello World' },
        },
      },
    };
    const connectedFields = [
      {
        fieldId: 'textField',
        locale: 'en-US',
        moduleName: 'test-module',
        updatedAt: new Date().toISOString(),
      },
    ];
    const cma = getCmaWithContentType([{ id: 'textField', type: 'Text' }]);

    mockConfigEntryServiceMethods(connectedFields);
    vi.spyOn(common, 'createModuleFile').mockResolvedValue(undefined);
    vi.spyOn(common, 'initContentfulManagementClient').mockReturnValue(cma as any);

    await handler(event as any, mockContext as any);

    expect(common.createModuleFile).toHaveBeenCalledWith(
      JSON.stringify([{ ...TEXT_FIELD_TEMPLATE[0], default: 'Hello World' }]),
      'fields.json',
      'test-module',
      'test-api-key'
    );
  });

  it('should update a module on entry save with RichText field', async () => {
    const minimalDocument: Document = { nodeType: BLOCKS.DOCUMENT, content: [], data: {} };
    const event = {
      headers: {
        'X-Contentful-Topic': 'Entry.save',
      },
      body: {
        sys: {
          id: 'test-entry-id',
          contentType: { sys: { id: 'test-content-type' } },
        },
        fields: {
          richTextField: { 'en-US': minimalDocument },
        },
      },
    };
    const connectedFields = [
      {
        fieldId: 'richTextField',
        locale: 'en-US',
        moduleName: 'test-module',
        updatedAt: new Date().toISOString(),
      },
    ];
    const cma = getCmaWithContentType([{ id: 'richTextField', type: 'RichText' }]);

    mockConfigEntryServiceMethods(connectedFields);
    vi.spyOn(common, 'createModuleFile').mockResolvedValue(undefined);
    vi.spyOn(common, 'initContentfulManagementClient').mockReturnValue(cma as any);

    await handler(event as any, mockContext as any);

    expect(common.createModuleFile).toHaveBeenCalledWith(
      JSON.stringify([
        {
          ...RICH_TEXT_FIELD_TEMPLATE[0],
          default: documentToHtmlString(minimalDocument),
        },
      ]),
      'fields.json',
      'test-module',
      'test-api-key'
    );
  });

  it('should update the config on save failure', async () => {
    const event = {
      headers: {
        'X-Contentful-Topic': 'Entry.save',
      },
      body: {
        sys: {
          id: 'test-entry-id',
          contentType: { sys: { id: 'test-content-type' } },
        },
        fields: {
          textField: { 'en-US': 'Hello World' },
        },
      },
    };
    const connectedFields = [
      {
        fieldId: 'textField',
        locale: 'en-US',
        moduleName: 'test-module',
        updatedAt: new Date().toISOString(),
      },
    ];
    const cma = getCmaWithContentType([{ id: 'textField', type: 'Text' }]);

    const { updateEntryConnectedFieldsMock } = mockConfigEntryServiceMethods(connectedFields);
    mockCommonMethods(cma, true);

    await handler(event as any, mockContext as any);

    expect(updateEntryConnectedFieldsMock).toHaveBeenCalledWith('test-entry-id', [
      expect.objectContaining({
        fieldId: 'textField',
        locale: 'en-US',
        moduleName: 'test-module',
        error: expect.objectContaining({ message: expect.stringContaining('Failed to update') }),
      }),
    ]);
  });
});

function getCmaWithContentType(contentTypeFields: { id: string; type: string }[]) {
  const contentType = { fields: contentTypeFields };
  return {
    contentType: {
      get: vi.fn().mockResolvedValue(contentType as any),
    },
  };
}

function mockConfigEntryServiceMethods(
  connectedFields1: { fieldId: string; locale: string; moduleName: string; updatedAt: string }[]
) {
  const getEntryConnectedFieldsMock = vi
    .spyOn(ConfigEntryService.prototype, 'getEntryConnectedFields')
    .mockResolvedValue(connectedFields1);
  const updateEntryConnectedFieldsMock = vi
    .spyOn(ConfigEntryService.prototype, 'updateEntryConnectedFields')
    .mockResolvedValue(undefined as any);
  return { getEntryConnectedFieldsMock, updateEntryConnectedFieldsMock };
}

function mockCommonMethods(cma: { contentType: any }, createFileWithError: boolean) {
  vi.spyOn(common, 'createModuleFile').mockRejectedValue(
    createFileWithError ? new Error('Failed to update') : undefined
  );
  vi.spyOn(common, 'initContentfulManagementClient').mockReturnValue(cma as any);
}
