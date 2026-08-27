import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AddAsanaCommentRequest, AppInstallationParameters } from '../../src/types';
import { handler } from '../../functions/addAsanaComment';

globalThis.fetch = vi.fn();

describe('addAsanaComment handler', () => {
  const mockContext = {
    appInstallationParameters: {
      oauthClientId: 'client-id',
      oauthClientSecret: 'client-secret',
      oauthRefreshToken: 'refresh-token',
      oauthRedirectUri: 'https://example.com/?oauthCallback=1',
      defaultWorkspaceGid: 'workspace-1',
      defaultWorkspaceName: 'Workspace',
      defaultProjectGid: 'project-1',
      defaultProjectName: 'Project',
    } satisfies AppInstallationParameters,
    spaceId: 'test-space',
    environmentId: 'test-env',
  } as unknown as FunctionEventContext;

  const createEvent = (
    body: AddAsanaCommentRequest
  ): AppActionRequest<'Custom', AddAsanaCommentRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    }) as AppActionRequest<'Custom', AddAsanaCommentRequest>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a comment to a task', async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token', expires_in: 3600 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            gid: 'story-1',
            text: 'Comment from Contentful',
          },
        }),
      } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770001',
        comment: 'Comment from Contentful',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: true,
      message: VALIDATION_MESSAGES.taskCommentAdded,
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks/1214128635770001/stories',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            text: 'Comment from Contentful',
          },
        }),
      }
    );
  });

  it('returns a validation error when comment is missing', async () => {
    const result = await handler(
      createEvent({
        taskId: '1214128635770001',
        comment: '   ',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.taskCommentRequired,
    });
  });

  it('returns a validation error when task id is missing', async () => {
    const result = await handler(
      createEvent({
        comment: 'Comment from Contentful',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.taskIdRequired,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns the Asana API error message on failure', async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token', expires_in: 3600 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [{ message: 'Task not found' }],
        }),
      } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770999',
        comment: 'Comment from Contentful',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: 'Task not found',
    });
  });
});
