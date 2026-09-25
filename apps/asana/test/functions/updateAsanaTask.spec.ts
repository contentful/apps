import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AppInstallationParameters, UpdateAsanaTaskRequest } from '../../src/types';
import { handler } from '../../functions/updateAsanaTask';

globalThis.fetch = vi.fn();

describe('updateAsanaTask handler', () => {
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
    spaceId: 'test-space',
    environmentId: 'test-env',
    oauthSdk: mockOauthSdk,
  } as unknown as FunctionEventContext;

  const createEvent = (
    body: UpdateAsanaTaskRequest
  ): AppActionRequest<'Custom', UpdateAsanaTaskRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', UpdateAsanaTaskRequest>);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
  });

  it('updates a task by gid', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770001',
          name: 'Updated launch brief',
          permalink_url: 'https://app.asana.com/0/1/1214128635770001/f',
          notes: 'Updated by the app action.',
          assignee: { name: 'Alex Doe' },
          due_on: '2026-05-02',
          completed: false,
        },
      }),
    } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770001',
        title: 'Updated launch brief',
        notes: 'Updated by the app action.',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: true,
      message: VALIDATION_MESSAGES.taskUpdated,
      task: {
        gid: '1214128635770001',
        name: 'Updated launch brief',
        permalinkUrl: 'https://app.asana.com/0/1/1214128635770001/f',
        description: 'Updated by the app action.',
        status: 'Open',
        assigneeName: 'Alex Doe',
        dueDate: '2026-05-02',
        completed: false,
      },
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks/1214128635770001?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.gid,assignee.name,dependencies.gid,dependencies.name,workspace.gid',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            name: 'Updated launch brief',
            notes: 'Updated by the app action.',
          },
        }),
      }
    );
  });

  it('accepts an Asana task URL', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770002',
          name: 'Completed task',
          permalink_url: 'https://app.asana.com/0/1/1214128635770002/f',
          notes: '',
          completed: true,
        },
      }),
    } as Response);

    await handler(
      createEvent({
        taskId:
          'https://app.asana.com/1/25238013228946/project/1214128631444825/task/1214128635770002',
        completed: true,
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks/1214128635770002?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.gid,assignee.name,dependencies.gid,dependencies.name,workspace.gid',
      expect.objectContaining({
        body: JSON.stringify({
          data: {
            completed: true,
          },
        }),
      })
    );
  });

  it('returns a validation error when task id is missing', async () => {
    const result = await handler(
      createEvent({
        title: 'Updated title',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.taskIdRequired,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns a validation error when no update fields are provided', async () => {
    const result = await handler(
      createEvent({
        taskId: '1214128635770001',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.taskUpdateFieldsRequired,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('allows clearing the task notes', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770003',
          name: 'Task with cleared notes',
          permalink_url: 'https://app.asana.com/0/1/1214128635770003/f',
          notes: '',
          completed: false,
        },
      }),
    } as Response);

    await handler(
      createEvent({
        taskId: '1214128635770003',
        notes: '',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks/1214128635770003?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.gid,assignee.name,dependencies.gid,dependencies.name,workspace.gid',
      expect.objectContaining({
        body: JSON.stringify({
          data: {
            notes: '',
          },
        }),
      })
    );
  });

  it('updates the assignee and due date', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770004',
          name: 'Reassigned task',
          permalink_url: 'https://app.asana.com/0/1/1214128635770004/f',
          assignee: { gid: 'user-1', name: 'Jamie Lee' },
          due_on: '2026-06-15',
          completed: false,
        },
      }),
    } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770004',
        assignee: 'jamie@example.com',
        dueDate: '2026-06-15',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: true,
      message: VALIDATION_MESSAGES.taskUpdated,
      task: {
        gid: '1214128635770004',
        name: 'Reassigned task',
        permalinkUrl: 'https://app.asana.com/0/1/1214128635770004/f',
        status: 'Open',
        assigneeName: 'Jamie Lee',
        assigneeGid: 'user-1',
        dueDate: '2026-06-15',
        completed: false,
      },
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/1214128635770004?opt_fields='),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          data: {
            assignee: 'jamie@example.com',
            due_on: '2026-06-15',
          },
        }),
      })
    );
  });

  it('clears the assignee and due date when empty strings are provided', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770005',
          name: 'Unassigned task',
          permalink_url: 'https://app.asana.com/0/1/1214128635770005/f',
          completed: false,
        },
      }),
    } as Response);

    await handler(
      createEvent({
        taskId: '1214128635770005',
        assignee: '',
        dueDate: '',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/1214128635770005?opt_fields='),
      expect.objectContaining({
        body: JSON.stringify({
          data: {
            assignee: null,
            due_on: null,
          },
        }),
      })
    );
  });

  it('adds a task dependency without requiring another field update', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770006',
          name: 'Task with dependency',
          permalink_url: 'https://app.asana.com/0/1/1214128635770006/f',
          dependencies: [{ gid: 'dep-1', name: 'Blocking task' }],
          completed: false,
        },
      }),
    } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770006',
        addDependencyGid: 'dep-1',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks/1214128635770006/addDependencies',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ data: { dependencies: ['dep-1'] } }),
      })
    );
    expect(result).toMatchObject({
      success: true,
      task: {
        gid: '1214128635770006',
        dependencies: [{ gid: 'dep-1', name: 'Blocking task' }],
      },
    });
  });

  it('resolves dependency names when Asana omits them from the task response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770008',
          name: 'Task with unresolved dependency',
          permalink_url: 'https://app.asana.com/0/1/1214128635770008/f',
          dependencies: [{ gid: 'dep-2' }],
          completed: false,
        },
      }),
    } as Response);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { gid: 'dep-2', name: 'Blocking task fetched individually' },
      }),
    } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770008',
        addDependencyGid: 'dep-2',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      3,
      'https://app.asana.com/api/1.0/tasks/dep-2?opt_fields=gid,name',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
        },
      })
    );
    expect(result).toMatchObject({
      success: true,
      task: {
        gid: '1214128635770008',
        dependencies: [{ gid: 'dep-2', name: 'Blocking task fetched individually' }],
      },
    });
  });

  it('removes a task dependency', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770007',
          name: 'Task without dependency',
          permalink_url: 'https://app.asana.com/0/1/1214128635770007/f',
          dependencies: [],
          completed: false,
        },
      }),
    } as Response);

    await handler(
      createEvent({
        taskId: '1214128635770007',
        removeDependencyGid: 'dep-1',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/tasks/1214128635770007/removeDependencies',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ data: { dependencies: ['dep-1'] } }),
      })
    );
  });

  it('returns the Asana API error message on failure', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        errors: [{ message: 'Task not found' }],
      }),
    } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770999',
        notes: 'Broken update',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: 'Task not found',
    });
  });
});
