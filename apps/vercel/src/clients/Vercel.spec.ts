import { Mock, afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VercelClient from './vercel';

global.fetch = vi.fn();

describe('VercelClient', () => {
  let client: VercelClient;

  beforeEach(() => {
    client = new VercelClient('access-token');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('#checkToken', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });
    describe('valid', () => {
      beforeEach(() => {
        (fetch as Mock).mockImplementationOnce(() => ({
          ok: true,
          json: vi.fn(),
        }));
      });

      it('returns true for valid token', async () => {
        const res = await client.checkToken();

        expect(res).toBe(true);
      });
    });
    describe('invalid', () => {
      beforeEach(() => {
        (fetch as Mock).mockImplementationOnce(() => ({
          ok: false,
          json: vi.fn(),
        }));
      });

      it('returns false for invalid token', async () => {
        const res = await client.checkToken();

        expect(res).toBe(false);
      });
    });
  });

  describe('#listProjects', () => {
    const expectedProjects = {
      projects: [
        {
          id: 2,
          name: 'vite',
        },
        {
          id: 3,
          name: 'vue',
        },
      ],
    };

    beforeEach(() => {
      (fetch as Mock).mockImplementationOnce(() => ({
        ok: true,
        json: vi.fn(() => new Promise((resolve) => resolve(expectedProjects))),
      }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('lists all projects for an authenticated user', async () => {
      const data = await client.listProjects();

      expect(data.projects.length).toBe(2);
      expect(data.projects).toBe(expectedProjects.projects);
    });
  });
});
