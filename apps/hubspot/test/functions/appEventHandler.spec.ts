import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../../functions/appEventHandler';
import ConfigEntryService from '../../src/utils/ConfigEntryService';
import { TEXT_FIELD_TEMPLATE, RICH_TEXT_FIELD_TEMPLATE } from '../../functions/templates';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
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
  const actual =
    await vi.importActual<typeof import('../../functions/common')>('../../functions/common');
  return {
    ...actual,
    createModuleFile: vi.fn(),
    getFiles: vi.fn(),
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

    const contentType = {
      fields: [{ id: 'textField', type: 'Text' }],
    };

    vi.spyOn(ConfigEntryService.prototype, 'getEntryConnectedFields').mockResolvedValue(
      connectedFields
    );
    vi.spyOn(ConfigEntryService.prototype, 'updateEntryConnectedFields').mockResolvedValue(
      undefined as any
    );
    (common.createModuleFile as jest.Mock).mockResolvedValue(undefined as any);
    vi.spyOn(common, 'getFiles').mockImplementation((type, value) => {
      const fieldsFile = structuredClone(TEXT_FIELD_TEMPLATE);
      fieldsFile[0].default = String(value);
      return { fieldsFile: JSON.stringify(fieldsFile), moduleFile: '' };
    });

    const cma = {
      contentType: {
        get: vi.fn().mockResolvedValue(contentType as any),
      },
    };

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
          richTextField: { 'en-US': { nodeType: 'document' as any, content: [] } },
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

    const contentType = {
      fields: [{ id: 'richTextField', type: 'RichText' }],
    };

    vi.spyOn(ConfigEntryService.prototype, 'getEntryConnectedFields').mockResolvedValue(
      connectedFields
    );
    vi.spyOn(ConfigEntryService.prototype, 'updateEntryConnectedFields').mockResolvedValue(
      undefined as any
    );
    (common.createModuleFile as jest.Mock).mockResolvedValue(undefined as any);
    vi.spyOn(common, 'getFiles').mockImplementation((type, value) => {
      const fieldsFile = structuredClone(RICH_TEXT_FIELD_TEMPLATE);
      fieldsFile[0].default = documentToHtmlString(value as any);
      return { fieldsFile: JSON.stringify(fieldsFile), moduleFile: '' };
    });
    const cma = {
      contentType: {
        get: vi.fn().mockResolvedValue(contentType as any),
      },
    };
    vi.spyOn(common, 'initContentfulManagementClient').mockReturnValue(cma as any);

    await handler(event as any, mockContext as any);

    expect(common.createModuleFile).toHaveBeenCalledWith(
      JSON.stringify([
        {
          ...RICH_TEXT_FIELD_TEMPLATE[0],
          default: documentToHtmlString({ nodeType: 'document', content: [] }),
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

    const contentType = {
      fields: [{ id: 'textField', type: 'Text' }],
    };

    vi.spyOn(ConfigEntryService.prototype, 'getEntryConnectedFields').mockResolvedValue(
      connectedFields
    );
    const updateEntryConnectedFieldsMock = vi
      .spyOn(ConfigEntryService.prototype, 'updateEntryConnectedFields')
      .mockResolvedValue(undefined as any);
    (common.createModuleFile as jest.Mock).mockRejectedValue(new Error('Failed to update'));
    vi.spyOn(common, 'getFiles').mockImplementation((type, value) => {
      const fieldsFile = structuredClone(TEXT_FIELD_TEMPLATE);
      fieldsFile[0].default = String(value);
      return { fieldsFile: JSON.stringify(fieldsFile), moduleFile: '' };
    });
    const cma = {
      contentType: {
        get: vi.fn().mockResolvedValue(contentType as any),
      },
    };
    vi.spyOn(common, 'initContentfulManagementClient').mockReturnValue(cma as any);

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
