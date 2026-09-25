import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppInstallationParameters } from '../../src/types';
import { handler } from '../../functions/getAsanaUsers';

globalThis.fetch = vi.fn();

describe('getAsanaUsers handler', () => {
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

  const createEvent = (body: {
    workspaceGid?: string;
    query?: string;
  }): AppActionRequest<'Custom', { workspaceGid?: string; query?: string }> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', { workspaceGid?: string; query?: string }>);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
  });

  it('searches users in a workspace', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { gid: '2', name: 'Jamie Lee', email: 'jamie@example.com', resource_type: 'user' },
          { gid: '1', name: 'Alex Doe', email: 'alex@example.com', resource_type: 'user' },
        ],
      }),
    } as Response);

    const result = await handler(
      createEvent({ workspaceGid: 'workspace-1', query: 'a' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      users: [
        { gid: '1', name: 'Alex Doe', email: 'alex@example.com' },
        { gid: '2', name: 'Jamie Lee', email: 'jamie@example.com' },
      ],
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workspaces/workspace-1/typeahead?resource_type=user'),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
        },
      })
    );
  });

  it('returns an empty list when no workspace is provided', async () => {
    const result = await handler(
      createEvent({ query: 'a' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({ users: [] });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('throws when the Asana request fails', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: [{ message: 'Invalid token' }] }),
    } as Response);

    await expect(
      handler(
        createEvent({ workspaceGid: 'workspace-1', query: 'a' }) as Parameters<typeof handler>[0],
        mockContext
      )
    ).rejects.toThrow('Could not search Asana users.');
  });
});
