import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppInstallationParameters } from '../../src/types';
import { handler } from '../../functions/getAsanaTasks';

globalThis.fetch = vi.fn();

describe('getAsanaTasks handler', () => {
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

  const createEvent = (body: {
    workspaceGid?: string;
    projectGid?: string;
    query?: string;
  }): AppActionRequest<'Custom', { workspaceGid?: string; projectGid?: string; query?: string }> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<
      'Custom',
      {
        workspaceGid?: string;
        projectGid?: string;
        query?: string;
      }
    >);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches tasks in a workspace', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { gid: '2', name: 'Beta task', resource_type: 'task' },
          { gid: '1', name: 'Alpha task', resource_type: 'task' },
        ],
      }),
    } as Response);

    const result = await handler(
      createEvent({ workspaceGid: 'workspace-1', query: 'task' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      tasks: [
        { gid: '1', name: 'Alpha task' },
        { gid: '2', name: 'Beta task' },
      ],
    });
  });

  it('searches tasks in a project when projectGid is provided', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { gid: '3', name: 'Manual link smoke test' },
          { gid: '4', name: 'Another task' },
        ],
      }),
    } as Response);

    const result = await handler(
      createEvent({
        workspaceGid: 'workspace-1',
        projectGid: 'project-1',
        query: 'manual',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      tasks: [{ gid: '3', name: 'Manual link smoke test' }],
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/projects/project-1/tasks?opt_fields=gid,name&completed_since=now&limit=100',
      {
        headers: {
          Authorization: 'Bearer installed-pat',
          Accept: 'application/json',
        },
      }
    );
  });

  it('returns an empty list when no workspace is provided', async () => {
    const result = await handler(
      createEvent({ query: 'task' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({ tasks: [] });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
