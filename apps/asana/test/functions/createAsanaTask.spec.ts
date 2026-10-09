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
      update: vi.fn(),
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
        return {
          sys: { id: 'asanaTaskLink' },
          fields: [
            { id: 'contentfulEntryId' },
            { id: 'contentTypeId' },
            { id: 'taskGid' },
            { id: 'taskUrl' },
            { id: 'taskName' },
            { id: 'taskDescription' },
            { id: 'status' },
            { id: 'assigneeName' },
            { id: 'dueDate' },
            { id: 'lastSyncedAt' },
            { id: 'lastAutosaveCommentAt' },
          ],
        } as never;
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
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
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
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: 'Dynamic entry title',
            notes:
              'Contentful entry: https://app.contentful.com/spaces/test-space/environments/test-env/entries/entry-1',
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
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: 'Launch headline',
            notes:
              'Contentful entry: https://app.contentful.com/spaces/test-space/environments/test-env/entries/entry-1',
            projects: ['project-1'],
            workspace: 'workspace-1',
          },
        }),
      })
    );
  });

  it('appends the Contentful entry link to caller-supplied notes without duplicating an existing link', async () => {
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
          notes: 'Please prioritize this.',
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: 'Dynamic entry title',
            notes:
              'Please prioritize this.\n\nContentful entry: https://app.contentful.com/spaces/test-space/environments/test-env/entries/entry-1',
            projects: ['project-1'],
            workspace: 'workspace-1',
          },
        }),
      })
    );

    vi.mocked(globalThis.fetch).mockClear();

    await handler(
      {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-1',
          notes:
            'Please prioritize this.\n\nContentful entry: https://app.contentful.com/spaces/test-space/environments/test-env/entries/entry-1',
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: 'Dynamic entry title',
            notes:
              'Please prioritize this.\n\nContentful entry: https://app.contentful.com/spaces/test-space/environments/test-env/entries/entry-1',
            projects: ['project-1'],
            workspace: 'workspace-1',
          },
        }),
      })
    );
  });

  it('leaves notes blank with no extra entry lookups when no notesFieldId is mapped', async () => {
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
        // Present in the entry, but since no notesFieldId was mapped, this must NOT be guessed -
        // and must not trigger any retry/wait either.
        notes: {
          'en-US': 'Should not be picked up implicitly',
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

    // Only the one initial entry lookup - no retry/wait loop was entered for notes.
    expect(mockCma.entry.get).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: 'Dynamic entry title',
            notes:
              'Contentful entry: https://app.contentful.com/spaces/test-space/environments/test-env/entries/entry-1',
            projects: ['project-1'],
            workspace: 'workspace-1',
          },
        }),
      })
    );
  });

  it('resolves notes from the entry when the caller maps a notesFieldId', async () => {
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
        summaryText: {
          'en-US': 'Custom notes field value',
        },
      },
    } as unknown as EntryProps<KeyValueMap>);

    await handler(
      {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          entryId: 'entry-1',
          notesFieldId: 'summaryText',
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: 'Dynamic entry title',
            notes:
              'Custom notes field value\n\nContentful entry: https://app.contentful.com/spaces/test-space/environments/test-env/entries/entry-1',
            projects: ['project-1'],
            workspace: 'workspace-1',
          },
        }),
      })
    );
  });

  it('polls once, on a shared budget, for both title and notes when neither is present yet', async () => {
    vi.useFakeTimers();
    try {
      // First lookup: entry exists but has no title/notes yet (e.g. "entry created" firing before
      // field values are saved). Second lookup (after one retry sleep): both fields have landed.
      vi.mocked(mockCma.entry.get)
        .mockResolvedValueOnce({
          sys: { id: 'entry-1', contentType: { sys: { id: 'blogPost' } } },
          fields: {},
        } as unknown as EntryProps<KeyValueMap>)
        .mockResolvedValue({
          sys: { id: 'entry-1', contentType: { sys: { id: 'blogPost' } } },
          fields: {
            title: { 'en-US': 'Late-arriving title' },
            notes: { 'en-US': 'Late-arriving notes' },
          },
        } as unknown as EntryProps<KeyValueMap>);

      const handlerPromise = handler(
        {
          type: FunctionTypeEnum.AppActionCall,
          body: {
            entryId: 'entry-1',
            notesFieldId: 'notes',
          },
        } as Parameters<typeof handler>[0],
        mockContext
      );

      // Let the single shared retry sleep elapse once, resolving both fields together.
      await vi.advanceTimersByTimeAsync(1800);
      await handlerPromise;

      // One initial lookup + exactly one retry lookup - not two independent retry loops.
      expect(mockCma.entry.get).toHaveBeenCalledTimes(2);
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        1,
        'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            data: {
              name: 'Late-arriving title',
              notes:
                'Late-arriving notes\n\nContentful entry: https://app.contentful.com/spaces/test-space/environments/test-env/entries/entry-1',
              projects: ['project-1'],
              workspace: 'workspace-1',
            },
          }),
        })
      );
    } finally {
      vi.useRealTimers();
    }
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

  it('still reports success when the task is created but the follow-up detail fetch fails', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: 'task-1',
          name: 'Created task',
          permalink_url: 'https://app.asana.com/0/1/task-1/f',
        },
      }),
    } as Response);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        errors: [{ message: 'Oops! An unexpected error occurred while processing this request.' }],
      }),
    } as Response);

    const result = await handler(
      {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          title: 'Static automation title',
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toMatchObject({
      success: true,
      task: {
        gid: 'task-1',
        permalinkUrl: 'https://app.asana.com/0/1/task-1/f',
      },
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('reports a duplicate task name instead of creating a second task, when requested', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            gid: 'task-existing',
            name: 'Launch Campaign',
            permalink_url: 'https://app.asana.com/0/1/task-existing',
          },
        ],
        next_page: null,
      }),
    } as Response);

    const result = await handler(
      {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          title: 'Launch Campaign',
          checkDuplicateName: true,
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toMatchObject({
      success: false,
      duplicateTaskName: true,
      duplicateTask: {
        gid: 'task-existing',
        name: 'Launch Campaign',
        permalinkUrl: 'https://app.asana.com/0/1/task-existing',
      },
    });
    // Only the duplicate-check lookup should have run - no task-creation POST.
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/project-1/tasks'),
      expect.anything()
    );
  });

  it('creates the task anyway when checkDuplicateName is false', async () => {
    const result = await handler(
      {
        type: FunctionTypeEnum.AppActionCall,
        body: {
          title: 'Launch Campaign',
          checkDuplicateName: false,
        },
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toMatchObject({
      success: true,
      task: { gid: 'task-1' },
    });
    // No duplicate-check lookup; straight to task creation (POST + the follow-up detail refetch).
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks?opt_fields=gid,name,permalink_url',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
