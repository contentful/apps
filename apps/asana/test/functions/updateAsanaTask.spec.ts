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
  const mockContext = {
    appInstallationParameters: {
      personalAccessToken: 'installed-pat',
      defaultWorkspaceGid: 'workspace-1',
      defaultWorkspaceName: 'Workspace',
      defaultProjectGid: 'project-1',
      defaultProjectName: 'Project',
    } satisfies AppInstallationParameters,
    spaceId: 'test-space',
    environmentId: 'test-env',
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
      'https://app.asana.com/api/1.0/tasks/1214128635770001?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer installed-pat',
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
      'https://app.asana.com/api/1.0/tasks/1214128635770002?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name',
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
      'https://app.asana.com/api/1.0/tasks/1214128635770003?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name',
      expect.objectContaining({
        body: JSON.stringify({
          data: {
            notes: '',
          },
        }),
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
