import { FunctionEventContext, FunctionTypeEnum } from '@contentful/node-apps-toolkit';
import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../../functions/appEventHandler';
import type { AppInstallationParameters } from '../../src/types';
import * as taskLinkStore from '../../src/utils/taskLinkStore';

vi.mock('../../src/utils/taskLinkStore', async () => {
  const actual = await vi.importActual('../../src/utils/taskLinkStore');
  return {
    ...actual,
    getTaskLinkForEntry: vi.fn(),
    recordAutosaveComment: vi.fn(),
  };
});

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
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
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

  describe('Entry.auto_save', () => {
    const linkedTask = {
      entryId: 'entry-1',
      taskGid: 'task-linked',
      taskUrl: 'https://app.asana.com/0/1/task-linked/f',
      taskName: 'Linked task',
    };

    const autoSaveEvent = (contentTypeId = 'blogPost') =>
      ({
        type: FunctionTypeEnum.AppEventHandler,
        headers: {
          'X-Contentful-Topic': 'ContentManagement.Entry.auto_save',
        },
        body: {
          sys: {
            id: 'entry-1',
            contentType: {
              sys: {
                id: contentTypeId,
              },
            },
          },
        },
      } as Parameters<typeof handler>[0]);

    it('posts a comment the first time a linked entry is autosaved', async () => {
      vi.mocked(taskLinkStore.getTaskLinkForEntry).mockResolvedValue(linkedTask);
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await handler(autoSaveEvent(), mockContext);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://app.asana.com/api/1.0/tasks/task-linked/stories',
        expect.objectContaining({ method: 'POST' })
      );
      expect(taskLinkStore.recordAutosaveComment).toHaveBeenCalledWith(mockCma, 'entry-1');
    });

    it('skips entries with no linked Asana task', async () => {
      vi.mocked(taskLinkStore.getTaskLinkForEntry).mockResolvedValue(null);

      await handler(autoSaveEvent(), mockContext);

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(taskLinkStore.recordAutosaveComment).not.toHaveBeenCalled();
    });

    it('skips the app internal asanaTaskLink bookkeeping entries', async () => {
      await handler(autoSaveEvent('asanaTaskLink'), mockContext);

      expect(taskLinkStore.getTaskLinkForEntry).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('skips posting a comment while still within the cooldown window', async () => {
      vi.mocked(taskLinkStore.getTaskLinkForEntry).mockResolvedValue({
        ...linkedTask,
        lastAutosaveCommentAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      });

      await handler(autoSaveEvent(), mockContext);

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(taskLinkStore.recordAutosaveComment).not.toHaveBeenCalled();
    });

    it('posts a new comment once the cooldown window has elapsed', async () => {
      vi.mocked(taskLinkStore.getTaskLinkForEntry).mockResolvedValue({
        ...linkedTask,
        lastAutosaveCommentAt: new Date(Date.now() - 61 * 60 * 1000).toISOString(), // 61 minutes ago
      });
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);

      await handler(autoSaveEvent(), mockContext);

      expect(globalThis.fetch).toHaveBeenCalled();
      expect(taskLinkStore.recordAutosaveComment).toHaveBeenCalledWith(mockCma, 'entry-1');
    });
  });
});
