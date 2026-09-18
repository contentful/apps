import { FunctionEventContext, FunctionTypeEnum } from '@contentful/node-apps-toolkit';
import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../../functions/createAsanaTask';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AppInstallationParameters } from '../../src/types';

globalThis.fetch = vi.fn();

describe('createAsanaTask', () => {
  const mockCma = {
    entry: {
      get: vi.fn(),
      update: vi.fn(),
    },
    contentType: {
      get: vi.fn(),
    },
    locale: {
      getMany: vi.fn(),
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
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          gid: 'task-1',
          name: 'Created task',
          permalink_url: 'https://app.asana.com/0/1/task-1/f',
        },
      }),
    } as Response);
    vi.mocked(mockCma.contentType.get).mockResolvedValue({
      displayField: 'title',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol' },
        { id: 'asanaTaskLink', name: 'Asana task link', type: 'Object' },
      ],
    } as never);
    vi.mocked(mockCma.locale.getMany).mockResolvedValue({
      items: [{ code: 'en-US', default: true }],
    } as never);
    vi.mocked(mockCma.entry.update).mockImplementation(async (_params, entry) => entry);
  });

  it('creates a task from an explicit title', async () => {
    const result = await handler(
      {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          title: 'Static automation title',
          notes: 'Static notes',
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toMatchObject({
      success: true,
      message: VALIDATION_MESSAGES.taskCreated,
      task: {
        gid: 'task-1',
        permalinkUrl: 'https://app.asana.com/0/1/task-1/f',
      },
    });
    expect(mockCma.entry.get).not.toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: 'Static automation title',
            notes: 'Static notes',
            projects: ['project-1'],
            workspace: 'workspace-1',
          },
        }),
      })
    );
  });

  it('uses the entry display field when the automation supplies an entry id', async () => {
    vi.mocked(mockCma.entry.get).mockResolvedValue({
      sys: {
        id: 'entry-1',
        contentType: {
          sys: {
            id: 'blogPost',
          },
        },
      },
      fields: {
        title: {
          'en-US': 'Dynamic entry title',
        },
      },
    } as unknown as EntryProps<KeyValueMap>);

    await handler(
      {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-1',
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'entry-1' });
    expect(mockCma.contentType.get).toHaveBeenCalledWith({ contentTypeId: 'blogPost' });
    expect(mockCma.entry.update).toHaveBeenCalledWith(
      { entryId: 'entry-1' },
      expect.objectContaining({
        fields: expect.objectContaining({
          asanaTaskLink: {
            'en-US': expect.objectContaining({
              taskGid: 'task-1',
              taskUrl: 'https://app.asana.com/0/1/task-1/f',
              taskName: 'Created task',
              lastSyncedAt: expect.any(String),
            }),
          },
        }),
      })
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name',
      expect.objectContaining({
        body: JSON.stringify({
          data: {
            name: 'Dynamic entry title',
            projects: ['project-1'],
            workspace: 'workspace-1',
          },
        }),
      })
    );
  });

  it('lets automations override the title field id', async () => {
    vi.mocked(mockCma.entry.get).mockResolvedValue({
      sys: {
        id: 'entry-1',
        contentType: {
          sys: {
            id: 'landingPage',
          },
        },
      },
      fields: {
        headline: {
          'en-US': 'Launch headline',
        },
      },
    } as unknown as EntryProps<KeyValueMap>);

    await handler(
      {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-1',
          titleFieldId: 'headline',
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(mockCma.contentType.get).toHaveBeenCalledWith({ contentTypeId: 'landingPage' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name',
      expect.objectContaining({
        body: JSON.stringify({
          data: {
            name: 'Launch headline',
            projects: ['project-1'],
            workspace: 'workspace-1',
          },
        }),
      })
    );
  });

  it('does not create another task when the entry is already linked', async () => {
    vi.mocked(mockCma.entry.get).mockResolvedValue({
      sys: {
        id: 'entry-1',
        contentType: {
          sys: {
            id: 'blogPost',
          },
        },
      },
      fields: {
        title: {
          'en-US': 'Dynamic entry title',
        },
        asanaTaskLink: {
          'en-US': {
            taskGid: 'task-existing',
            taskUrl: 'https://app.asana.com/0/1/task-existing/f',
            taskName: 'Existing linked task',
          },
        },
      },
    } as unknown as EntryProps<KeyValueMap>);

    const result = await handler(
      {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-1',
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toMatchObject({
      success: true,
      entryLinked: true,
      task: {
        gid: 'task-existing',
        name: 'Existing linked task',
        permalinkUrl: 'https://app.asana.com/0/1/task-existing/f',
      },
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mockCma.entry.update).not.toHaveBeenCalled();
  });
});
