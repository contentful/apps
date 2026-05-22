import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjects } from '../../functions/asanaClient';

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
