import { FunctionEventContext, FunctionTypeEnum } from '@contentful/node-apps-toolkit';
import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../../functions/appEventHandler';
import { syncFieldMappingsForEntry } from '../../functions/syncFieldMappings';
import type { AppInstallationParameters } from '../../src/types';

globalThis.fetch = vi.fn();

vi.mock('../../functions/syncFieldMappings', () => ({
  syncFieldMappingsForEntry: vi.fn(),
}));

describe('appEventHandler', () => {
  const mockEntry = {
    sys: {
      id: 'entry-1',
      contentType: {
        sys: {
          id: 'asanaTaskRequest',
        },
      },
    },
    fields: {
      status: {
        'en-US': 'Ready for Asana',
      },
      taskName: {
        'en-US': 'Publish-driven task',
      },
      taskNotes: {
        'en-US': 'Created from the app event handler.',
      },
    },
  } as unknown as EntryProps<KeyValueMap>;

  const mockCma = {
    entry: {
      get: vi.fn(),
    },
  } as unknown as PlainClientAPI;

  const mockOauthSdk = {
    token: vi.fn().mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    }),
  };

  const mockContext = {
    appInstallationParameters: {
      defaultWorkspaceGid: 'workspace-1',
      defaultWorkspaceName: 'Workspace',
      defaultProjectGid: 'project-1',
      defaultProjectName: 'Project',
    } satisfies AppInstallationParameters,
    cma: mockCma,
    spaceId: 'test-space',
    environmentId: 'test-env',
    oauthSdk: mockOauthSdk,
  } as unknown as FunctionEventContext;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockCma.entry.get).mockResolvedValue(mockEntry);
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
    vi.mocked(syncFieldMappingsForEntry).mockResolvedValue({
      success: true,
      message: 'Synced field mappings to Asana.',
      updatedFieldCount: 1,
    });
  });

  it('creates a task when a matching entry is published', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: 'task-1',
          name: 'Publish-driven task',
          permalink_url: 'https://app.asana.com/0/1/task-1/f',
        },
      }),
    } as Response);

    await handler(
      {
        type: FunctionTypeEnum.AppEventHandler,
        headers: {
          'X-Contentful-Topic': 'ContentManagement.Entry.publish',
        },
        body: {
          sys: {
            id: 'entry-1',
            contentType: {
              sys: {
                id: 'asanaTaskRequest',
              },
            },
          },
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'entry-1' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url,notes,completed,due_on,created_at,modified_at,assignee.gid,assignee.name,dependencies.gid,dependencies.name,tags.gid,tags.name,workspace.gid,memberships.project.gid,memberships.section.gid,memberships.section.name,custom_fields.gid,custom_fields.name,custom_fields.type,custom_fields.enum_options.gid,custom_fields.enum_options.name,custom_fields.enum_options.enabled,custom_fields.text_value,custom_fields.number_value,custom_fields.precision,custom_fields.enum_value.gid,custom_fields.enum_value.name,custom_fields.multi_enum_values.gid,custom_fields.multi_enum_values.name,custom_fields.date_value.date,custom_fields.people_value.gid,custom_fields.people_value.name,custom_fields.display_value',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            name: 'Publish-driven task',
            notes: 'Created from the app event handler.',
            projects: ['project-1'],
            workspace: 'workspace-1',
          },
        }),
      }
    );
  });

  it('ignores entry saves when no field mapping matches the content type', async () => {
    await handler(
      {
        type: FunctionTypeEnum.AppEventHandler,
        headers: {
          'X-Contentful-Topic': 'ContentManagement.Entry.save',
        },
        body: {
          sys: {
            id: 'entry-1',
            contentType: {
              sys: {
                id: 'asanaTaskRequest',
              },
            },
          },
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(mockCma.entry.get).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(syncFieldMappingsForEntry).not.toHaveBeenCalled();
  });

  it('syncs field mappings when a mapped content type is saved', async () => {
    const contextWithFieldMappings = {
      ...mockContext,
      appInstallationParameters: {
        ...mockContext.appInstallationParameters,
        fieldMappings: [
          {
            contentTypeId: 'blogPost',
            contentTypeName: 'Blog Post',
            contentfulFieldId: 'status',
            contentfulFieldName: 'Status',
            asanaCustomFieldGid: 'custom-field-1',
            asanaCustomFieldName: 'Address',
          },
        ],
      },
    } as unknown as FunctionEventContext;

    await handler(
      {
        type: FunctionTypeEnum.AppEventHandler,
        headers: {
          'X-Contentful-Topic': 'ContentManagement.Entry.save',
        },
        body: {
          sys: {
            id: 'entry-1',
            contentType: {
              sys: {
                id: 'blogPost',
              },
            },
          },
        },
      } as Parameters<typeof handler>[0],
      contextWithFieldMappings
    );

    expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'entry-1' });
    expect(syncFieldMappingsForEntry).toHaveBeenCalledWith(
      expect.objectContaining({ entry: mockEntry, accessToken: 'test-access-token' })
    );
  });

  it('skips syncing a saved entry when Asana is not connected', async () => {
    mockOauthSdk.token.mockRejectedValueOnce(new Error('not connected'));
    const contextWithFieldMappings = {
      ...mockContext,
      appInstallationParameters: {
        ...mockContext.appInstallationParameters,
        fieldMappings: [
          {
            contentTypeId: 'blogPost',
            contentTypeName: 'Blog Post',
            contentfulFieldId: 'status',
            contentfulFieldName: 'Status',
            asanaCustomFieldGid: 'custom-field-1',
            asanaCustomFieldName: 'Address',
          },
        ],
      },
    } as unknown as FunctionEventContext;

    await handler(
      {
        type: FunctionTypeEnum.AppEventHandler,
        headers: {
          'X-Contentful-Topic': 'ContentManagement.Entry.save',
        },
        body: {
          sys: {
            id: 'entry-1',
            contentType: {
              sys: {
                id: 'blogPost',
              },
            },
          },
        },
      } as Parameters<typeof handler>[0],
      contextWithFieldMappings
    );

    expect(mockCma.entry.get).not.toHaveBeenCalled();
    expect(syncFieldMappingsForEntry).not.toHaveBeenCalled();
  });

  it('ignores publishes for other content types', async () => {
    await handler(
      {
        type: FunctionTypeEnum.AppEventHandler,
        headers: {
          'X-Contentful-Topic': 'ContentManagement.Entry.publish',
        },
        body: {
          sys: {
            id: 'entry-1',
            contentType: {
              sys: {
                id: 'blogPost',
              },
            },
          },
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(mockCma.entry.get).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('ignores entries that are not ready for Asana', async () => {
    vi.mocked(mockCma.entry.get).mockResolvedValueOnce({
      ...mockEntry,
      fields: {
        ...mockEntry.fields,
        status: {
          'en-US': 'Draft',
        },
      },
    });

    await handler(
      {
        type: FunctionTypeEnum.AppEventHandler,
        headers: {
          'X-Contentful-Topic': 'ContentManagement.Entry.publish',
        },
        body: {
          sys: {
            id: 'entry-1',
            contentType: {
              sys: {
                id: 'asanaTaskRequest',
              },
            },
          },
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'entry-1' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
