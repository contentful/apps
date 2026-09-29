import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { PlainClientAPI } from 'contentful-management';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AddAsanaCommentRequest, AppInstallationParameters } from '../../src/types';
import { handler } from '../../functions/addAsanaComment';

globalThis.fetch = vi.fn();

describe('addAsanaComment handler', () => {
  const mockCma = {
    entry: {
      getMany: vi.fn(),
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

  const createEvent = (
    body: AddAsanaCommentRequest
  ): AppActionRequest<'Custom', AddAsanaCommentRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', AddAsanaCommentRequest>);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({ items: [] } as never);
    vi.mocked(mockCma.locale.getMany).mockResolvedValue({
      items: [{ code: 'en-US', default: true }],
    } as never);
  });

  it('adds a comment to a task', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
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
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
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

  it('resolves the task via a linked entry id when no task id is provided', async () => {
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({
      items: [
        {
          sys: { id: 'link-entry-1' },
          fields: {
            contentfulEntryId: { 'en-US': 'entry-1' },
            taskGid: { 'en-US': 'task-linked' },
            taskUrl: { 'en-US': 'https://app.asana.com/0/1/task-linked/f' },
            taskName: { 'en-US': 'Linked task' },
          },
        },
      ],
    } as never);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
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
        entryId: 'entry-1',
        comment: 'Comment from Contentful',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: true,
      message: VALIDATION_MESSAGES.taskCommentAdded,
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks/task-linked/stories',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns an entryNotLinked error when the entry has no linked task', async () => {
    const result = await handler(
      createEvent({
        entryId: 'entry-unlinked',
        comment: 'Comment from Contentful',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.entryNotLinked,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
