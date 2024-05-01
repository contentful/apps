import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VercelClient from './Vercel';
import { mockDeploymentSummary } from '@test/mocks';

global.fetch = vi.fn();

describe('VercelClient', () => {
  let client: VercelClient;

  beforeEach(() => {
    client = new VercelClient('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('#checkToken', () => {
    describe('valid', () => {
      beforeEach(() => {
        (fetch as Mock).mockImplementationOnce(() => ({
          ok: true,
          json: vi.fn(() => new Promise((resolve) => resolve({ token: { teamId: '1234' } }))),
        }));
        (fetch as Mock).mockImplementationOnce(() => ({
          ok: true,
          json: vi.fn(),
        }));
      });

      it('returns true for valid token', async () => {
        const res = await client.checkToken();

        expect(res.ok).toBe(true);
      });
    });

    describe('invalid', () => {
      beforeEach(() => {
        (fetch as Mock).mockImplementationOnce(() => ({
          ok: false,
          json: vi.fn(() => new Promise((rejects) => rejects({ token: { teamId: '1234' } }))),
        }));
      });

      it('returns false for invalid token', async () => {
        await expect(client.checkToken()).rejects.toThrowError();
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

  describe('#listApiPaths', () => {
    const projectId = '1234';
    const expectedDeploymentSummary = mockDeploymentSummary;
    const expectedApiPaths = [
      { name: 'api/enable-draft', id: 'api/enable-draft' },
      { name: 'api/disable-draft', id: 'api/disable-draft' },
    ];

    beforeEach(() => {
      (fetch as Mock).mockImplementationOnce(() => ({
        ok: true,
        json: vi.fn(() => new Promise((resolve) => resolve({ deployments: [{ uid: '1234' }] }))),
      }));
      (fetch as Mock).mockImplementationOnce(() => ({
        ok: true,
        json: vi.fn(() => new Promise((resolve) => resolve(expectedDeploymentSummary))),
      }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('lists all api paths for an authenticated user', async () => {
      const data = await client.listApiPaths(projectId);

      expect(data.length).toBe(2);
      expect(data).toStrictEqual(expectedApiPaths);
    });
  });
});
