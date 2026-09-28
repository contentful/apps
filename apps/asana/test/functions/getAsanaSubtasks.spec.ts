import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AppInstallationParameters, GetAsanaSubtasksRequest } from '../../src/types';
import { handler } from '../../functions/getAsanaSubtasks';

globalThis.fetch = vi.fn();

describe('getAsanaSubtasks handler', () => {
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
    body: GetAsanaSubtasksRequest
  ): AppActionRequest<'Custom', GetAsanaSubtasksRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', GetAsanaSubtasksRequest>);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
  });

  it('loads subtasks for a task', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            gid: 'subtask-1',
            name: 'First subtask',
            completed: false,
            permalink_url: 'https://app.asana.com/1/1/task/subtask-1',
          },
          {
            gid: 'subtask-2',
            name: 'Second subtask',
            completed: true,
            permalink_url: 'https://app.asana.com/1/1/task/subtask-2',
          },
        ],
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
      message: 'Asana subtasks loaded successfully.',
      subtasks: [
        {
          gid: 'subtask-1',
          name: 'First subtask',
          completed: false,
          permalinkUrl: 'https://app.asana.com/1/1/task/subtask-1',
        },
        {
          gid: 'subtask-2',
          name: 'Second subtask',
          completed: true,
          permalinkUrl: 'https://app.asana.com/1/1/task/subtask-2',
        },
      ],
    });
  });

  it('accepts an Asana task URL', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    await handler(
      createEvent({
        taskId:
          'https://app.asana.com/1/25238013228946/project/1214128631444825/task/1214128635770002',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks/1214128635770002/subtasks?opt_fields=gid,name,completed,permalink_url&limit=100',
      {
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
        },
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

  it('returns a validation error when the access token is missing', async () => {
    mockOauthSdk.token.mockResolvedValueOnce(
      undefined as unknown as Awaited<ReturnType<typeof mockOauthSdk.token>>
    );

    const result = await handler(
      createEvent({
        taskId: '1214128635770001',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.tokenRequired,
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
