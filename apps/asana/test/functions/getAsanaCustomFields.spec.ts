import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AppInstallationParameters, GetAsanaCustomFieldsRequest } from '../../src/types';
import { handler } from '../../functions/getAsanaCustomFields';

globalThis.fetch = vi.fn();

describe('getAsanaCustomFields handler', () => {
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
    body: GetAsanaCustomFieldsRequest
  ): AppActionRequest<'Custom', GetAsanaCustomFieldsRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', GetAsanaCustomFieldsRequest>);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
  });

  it('loads custom field definitions, dropping disabled enum options', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            custom_field: {
              gid: 'cf1',
              name: 'Priority',
              type: 'enum',
              enum_options: [
                { gid: 'opt1', name: 'High', enabled: true },
                { gid: 'opt2', name: 'Retired', enabled: false },
                { gid: 'opt3', name: 'Low', enabled: true },
              ],
            },
          },
          {
            custom_field: {
              gid: 'cf2',
              name: 'Notes',
              type: 'text',
            },
          },
        ],
      }),
    } as Response);

    const result = await handler(
      createEvent({ projectGid: 'project-1' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: true,
      message: 'Asana custom fields loaded successfully.',
      customFields: [
        {
          gid: 'cf1',
          name: 'Priority',
          type: 'enum',
          enumOptions: [
            { gid: 'opt1', name: 'High' },
            { gid: 'opt3', name: 'Low' },
          ],
        },
        {
          gid: 'cf2',
          name: 'Notes',
          type: 'text',
        },
      ],
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/projects/project-1/custom_field_settings?opt_fields=custom_field.gid,custom_field.name,custom_field.type,custom_field.enum_options.gid,custom_field.enum_options.name,custom_field.enum_options.enabled&limit=100',
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
