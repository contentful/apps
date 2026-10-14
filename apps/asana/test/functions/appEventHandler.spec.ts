import { FunctionEventContext, FunctionTypeEnum } from '@contentful/node-apps-toolkit';
import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../../functions/appEventHandler';
import type { AppInstallationParameters } from '../../src/types';

globalThis.fetch = vi.fn();

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

  const mockContext = {
    appInstallationParameters: {
      personalAccessToken: 'installed-pat',
      defaultWorkspaceGid: 'workspace-1',
      defaultWorkspaceName: 'Workspace',
      defaultProjectGid: 'project-1',
      defaultProjectName: 'Project',
    } satisfies AppInstallationParameters,
    cma: mockCma,
    spaceId: 'test-space',
    environmentId: 'test-env',
  } as unknown as FunctionEventContext;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockCma.entry.get).mockResolvedValue(mockEntry);
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
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer installed-pat',
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

  it('ignores non-publish entry events', async () => {
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
