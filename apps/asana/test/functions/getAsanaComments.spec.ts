import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AppInstallationParameters, GetAsanaCommentsRequest } from '../../src/types';
import { handler } from '../../functions/getAsanaComments';

globalThis.fetch = vi.fn();

describe('getAsanaComments handler', () => {
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
    body: GetAsanaCommentsRequest
  ): AppActionRequest<'Custom', GetAsanaCommentsRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', GetAsanaCommentsRequest>);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
  });

  it('loads comment stories for a task, filtering out non-comment activity', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            gid: 'story-1',
            text: 'This task was marked complete.',
            resource_subtype: 'marked_complete',
            created_at: '2026-01-01T00:00:00.000Z',
            created_by: { name: 'Alex Doe' },
          },
          {
            gid: 'story-2',
            text: 'Sounds good, thanks!',
            resource_subtype: 'comment_added',
            created_at: '2026-01-02T00:00:00.000Z',
            created_by: { name: 'Jamie Smith' },
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
      message: 'Asana comments loaded successfully.',
      comments: [
        {
          gid: 'story-2',
          text: 'Sounds good, thanks!',
          authorName: 'Jamie Smith',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    });
  });

  it('falls back to Unknown when a comment has no author', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            gid: 'story-3',
            text: 'Comment from a deleted user.',
            resource_subtype: 'comment_added',
            created_at: '2026-01-03T00:00:00.000Z',
            created_by: null,
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
      message: 'Asana comments loaded successfully.',
      comments: [
        {
          gid: 'story-3',
          text: 'Comment from a deleted user.',
          authorName: 'Unknown',
          createdAt: '2026-01-03T00:00:00.000Z',
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
      'https://app.asana.com/api/1.0/tasks/1214128635770002/stories?opt_fields=gid,text,created_at,resource_subtype,created_by.name&limit=100',
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
