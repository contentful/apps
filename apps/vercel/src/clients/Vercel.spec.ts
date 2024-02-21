import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VercelClient from './vercel';

describe('VercelClient', () => {
  let client: VercelClient;

  beforeEach(() => {
    client = new VercelClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('#listProjects', () => {
    const expectedProjects = [
      {
        id: 2,
      },
      {
        id: 3,
      },
    ];

    beforeEach(() => {
      global.fetch = vi.fn().mockImplementation(() => ({
        ok: true,
        json: vi.fn(
          () =>
            new Promise((resolve) =>
              resolve({
                data: expectedProjects,
              })
            )
        ),
      }));
    });

    it('lists all projects for an authenticated user', async () => {
      const projects = await client.listProjects();

      expect(projects.length).toBe(2);
    });
  });
});
