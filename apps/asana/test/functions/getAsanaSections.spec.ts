import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AppInstallationParameters, GetAsanaSectionsRequest } from '../../src/types';
import { handler } from '../../functions/getAsanaSections';

globalThis.fetch = vi.fn();

describe('getAsanaSections handler', () => {
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
    body: GetAsanaSectionsRequest
  ): AppActionRequest<'Custom', GetAsanaSectionsRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', GetAsanaSectionsRequest>);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
  });

  it('loads sections for a project', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { gid: 's1', name: 'Incoming from Contentful' },
          { gid: 's2', name: 'In Progress' },
          { gid: 's3', name: 'Done' },
        ],
      }),
    } as Response);

    const result = await handler(
      createEvent({ projectGid: 'project-1' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: true,
      message: 'Asana sections loaded successfully.',
      sections: [
        { gid: 's1', name: 'Incoming from Contentful' },
        { gid: 's2', name: 'In Progress' },
        { gid: 's3', name: 'Done' },
      ],
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/projects/project-1/sections?opt_fields=gid,name',
      {
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
        },
      }
    );
  });

  it('returns a validation error when project gid is missing', async () => {
    const result = await handler(createEvent({}) as Parameters<typeof handler>[0], mockContext);

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.taskDestinationRequired,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns the Asana API error message on failure', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        errors: [{ message: 'Project not found' }],
      }),
    } as Response);

    const result = await handler(
      createEvent({ projectGid: 'missing-project' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: 'Project not found',
    });
  });
});
