import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AppInstallationParameters, GetAsanaTaskRequest } from '../../src/types';
import { handler } from '../../functions/getAsanaTask';

globalThis.fetch = vi.fn();

describe('getAsanaTask handler', () => {
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
    body: GetAsanaTaskRequest
  ): AppActionRequest<'Custom', GetAsanaTaskRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', GetAsanaTaskRequest>);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a task by gid', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770001',
          name: 'Existing launch brief',
          permalink_url: 'https://app.asana.com/0/1/1214128635770001/f',
          notes: 'Launch brief description from Asana.',
          assignee: { name: 'Alex Doe' },
          due_on: '2026-04-30',
          completed: false,
        },
      }),
    } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770001',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: true,
      message: 'Asana task loaded successfully.',
      task: {
        gid: '1214128635770001',
        name: 'Existing launch brief',
        permalinkUrl: 'https://app.asana.com/0/1/1214128635770001/f',
        description: 'Launch brief description from Asana.',
        status: 'Open',
        assigneeName: 'Alex Doe',
        dueDate: '2026-04-30',
        completed: false,
      },
    });
  });

  it('accepts an Asana task URL', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770002',
          name: 'Existing linked task',
          permalink_url: 'https://app.asana.com/0/1/1214128635770002/f',
          notes: 'Existing linked task description.',
          completed: false,
        },
      }),
    } as Response);

    await handler(
      createEvent({
        taskId:
          'https://app.asana.com/1/25238013228946/project/1214128631444825/task/1214128635770002',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks/1214128635770002?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer installed-pat',
          Accept: 'application/json',
        },
        body: undefined,
      }
    );
  });

  it('returns a validation error when task id is missing', async () => {
    const result = await handler(createEvent({}) as Parameters<typeof handler>[0], mockContext);

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.taskIdRequired,
    });
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
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: 'Task not found',
    });
  });
});
