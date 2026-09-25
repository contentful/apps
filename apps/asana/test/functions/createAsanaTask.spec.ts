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
      getMany: vi.fn(),
      create: vi.fn(),
      publish: vi.fn(),
      unpublish: vi.fn(),
      delete: vi.fn(),
    },
    contentType: {
      get: vi.fn(),
      createWithId: vi.fn(),
      publish: vi.fn(),
    },
    locale: {
      getMany: vi.fn(),
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
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
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
    // The `asanaTaskLink` content type already exists; entry content types resolve with a
    // display field so title resolution keeps working.
    vi.mocked(mockCma.contentType.get).mockImplementation(async ({ contentTypeId }) => {
      if (contentTypeId === 'asanaTaskLink') {
        return { sys: { id: 'asanaTaskLink' } } as never;
      }
      return { displayField: 'title' } as never;
    });
    vi.mocked(mockCma.locale.getMany).mockResolvedValue({
      items: [{ code: 'en-US', default: true }],
    } as never);
    vi.mocked(mockCma.entry.update).mockImplementation(async (_params, entry) => entry as never);
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({ items: [] } as never);
    vi.mocked(mockCma.entry.create).mockImplementation(
      async (_params, entry) => ({ sys: { id: 'link-entry-1' }, ...(entry as object) } as never)
    );
    vi.mocked(mockCma.entry.publish).mockImplementation(async (_params, entry) => entry as never);
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
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.gid,assignee.name,dependencies.gid,dependencies.name,workspace.gid',
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
    expect(mockCma.entry.create).toHaveBeenCalledWith(
      { contentTypeId: 'asanaTaskLink' },
      expect.objectContaining({
        fields: expect.objectContaining({
          contentfulEntryId: { 'en-US': 'entry-1' },
          taskGid: { 'en-US': 'task-1' },
          taskUrl: { 'en-US': 'https://app.asana.com/0/1/task-1/f' },
          taskName: { 'en-US': 'Created task' },
        }),
      })
    );
    expect(mockCma.entry.publish).toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.gid,assignee.name,dependencies.gid,dependencies.name,workspace.gid',
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
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.gid,assignee.name,dependencies.gid,dependencies.name,workspace.gid',
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
      },
    } as unknown as EntryProps<KeyValueMap>);
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({
      items: [
        {
          sys: { id: 'link-entry-1' },
          fields: {
            contentfulEntryId: { 'en-US': 'entry-1' },
            taskGid: { 'en-US': 'task-existing' },
            taskUrl: { 'en-US': 'https://app.asana.com/0/1/task-existing/f' },
            taskName: { 'en-US': 'Existing linked task' },
          },
        },
      ],
    } as never);

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
    expect(mockCma.entry.create).not.toHaveBeenCalled();
  });
});
