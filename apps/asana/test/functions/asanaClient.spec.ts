import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findDuplicateTaskByName,
  getAsanaAccessToken,
  getProjects,
} from '../../functions/asanaClient';

globalThis.fetch = vi.fn();

describe('asanaClient pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads all pages of projects for a workspace', async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ gid: 'project-2', name: 'Zoo project' }],
          next_page: {
            path: '/workspaces/workspace-1/projects?opt_fields=gid,name&limit=100&offset=page-2',
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ gid: 'project-1', name: 'Alpha project' }],
          next_page: null,
        }),
      } as Response);

    const projects = await getProjects('pat-123', 'workspace-1');

    expect(projects).toEqual([
      { gid: 'project-1', name: 'Alpha project' },
      { gid: 'project-2', name: 'Zoo project' },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/workspaces/workspace-1/projects?opt_fields=gid,name&limit=100',
      {
        headers: {
          Authorization: 'Bearer pat-123',
          Accept: 'application/json',
        },
      }
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      'https://app.asana.com/api/1.0/workspaces/workspace-1/projects?opt_fields=gid,name&limit=100&offset=page-2',
      {
        headers: {
          Authorization: 'Bearer pat-123',
          Accept: 'application/json',
        },
      }
    );
  });
});

describe('findDuplicateTaskByName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a matching incomplete task in the project, case-insensitively', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { gid: 'task-1', name: 'Other task' },
          {
            gid: 'task-2',
            name: 'Launch Campaign',
            permalink_url: 'https://app.asana.com/0/1/task-2',
          },
        ],
        next_page: null,
      }),
    } as Response);

    const match = await findDuplicateTaskByName(
      'pat-123',
      { projectGid: 'project-1' },
      'launch campaign'
    );

    expect(match).toEqual({
      gid: 'task-2',
      name: 'Launch Campaign',
      permalinkUrl: 'https://app.asana.com/0/1/task-2',
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/projects/project-1/tasks?opt_fields=gid,name,permalink_url&completed_since=now&limit=100',
      expect.objectContaining({ headers: expect.anything() })
    );
  });

  it('returns null when no task in the project matches the name', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ gid: 'task-1', name: 'Other task' }], next_page: null }),
    } as Response);

    const match = await findDuplicateTaskByName(
      'pat-123',
      { projectGid: 'project-1' },
      'Launch Campaign'
    );

    expect(match).toBeNull();
  });

  it('falls back to a workspace typeahead search when no project is given', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ gid: 'task-9', name: 'Launch Campaign', resource_type: 'task' }],
        next_page: null,
      }),
    } as Response);

    const match = await findDuplicateTaskByName(
      'pat-123',
      { workspaceGid: 'workspace-1' },
      'Launch Campaign'
    );

    expect(match).toEqual({ gid: 'task-9', name: 'Launch Campaign' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workspaces/workspace-1/typeahead?'),
      expect.objectContaining({ headers: expect.anything() })
    );
  });

  it('returns null when neither a project nor a workspace is given', async () => {
    const match = await findDuplicateTaskByName('pat-123', {}, 'Launch Campaign');

    expect(match).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('getAsanaAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the access token from the OAuth SDK', async () => {
    const context = {
      oauthSdk: {
        token: vi.fn().mockResolvedValue({
          tokenType: 'bearer',
          accessToken: 'sdk-access-token',
          expiry: 3600,
        }),
      },
    } as unknown as Parameters<typeof getAsanaAccessToken>[1];

    const result = await getAsanaAccessToken(
      {} as Parameters<typeof getAsanaAccessToken>[0],
      context
    );

    expect(result).toEqual('sdk-access-token');
  });

  it('throws when the OAuth SDK is not available on the context', async () => {
    const context = {} as Parameters<typeof getAsanaAccessToken>[1];

    await expect(
      getAsanaAccessToken({} as Parameters<typeof getAsanaAccessToken>[0], context)
    ).rejects.toThrow('OAuth SDK is not available in this function context.');
  });

  it('falls back to the installation-level API key when there is no connected-user OAuth session', async () => {
    const context = {
      oauthSdk: {
        token: vi.fn().mockRejectedValue(new Error('not connected')),
      },
      appInstallationParameters: {
        asanaApiKey: '  shared-api-key  ',
      },
    } as unknown as Parameters<typeof getAsanaAccessToken>[1];

    const result = await getAsanaAccessToken(
      {} as Parameters<typeof getAsanaAccessToken>[0],
      context
    );

    expect(result).toEqual('shared-api-key');
  });

  it('returns an empty string when neither OAuth nor an API key is available', async () => {
    const context = {
      oauthSdk: {
        token: vi.fn().mockRejectedValue(new Error('not connected')),
      },
      appInstallationParameters: {},
    } as unknown as Parameters<typeof getAsanaAccessToken>[1];

    const result = await getAsanaAccessToken(
      {} as Parameters<typeof getAsanaAccessToken>[0],
      context
    );

    expect(result).toEqual('');
  });
});
