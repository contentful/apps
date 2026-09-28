import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AppInstallationParameters, UpdateAsanaCustomFieldRequest } from '../../src/types';
import { handler } from '../../functions/updateAsanaCustomField';

globalThis.fetch = vi.fn();

describe('updateAsanaCustomField handler', () => {
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
    body: UpdateAsanaCustomFieldRequest
  ): AppActionRequest<'Custom', UpdateAsanaCustomFieldRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', UpdateAsanaCustomFieldRequest>);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
  });

  it('updates a text custom field on a task', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770001',
          name: 'Task with updated field',
          permalink_url: 'https://app.asana.com/0/1/1214128635770001/f',
          completed: false,
          custom_fields: [
            {
              gid: 'field-1',
              name: 'Summary',
              type: 'text',
              text_value: 'Updated summary',
            },
          ],
        },
      }),
    } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770001',
        fieldGid: 'field-1',
        fieldType: 'text',
        value: JSON.stringify('Updated summary'),
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: true,
      message: VALIDATION_MESSAGES.customFieldUpdated,
      task: expect.objectContaining({
        gid: '1214128635770001',
        customFields: [
          {
            gid: 'field-1',
            name: 'Summary',
            type: 'text',
            textValue: 'Updated summary',
          },
        ],
      }),
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/1214128635770001?opt_fields='),
      expect.objectContaining({
        method: 'PUT',
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { custom_fields: { 'field-1': 'Updated summary' } },
        }),
      })
    );
  });

  it('accepts an Asana task URL', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770002',
          name: 'Task via URL',
          permalink_url: 'https://app.asana.com/0/1/1214128635770002/f',
          completed: false,
        },
      }),
    } as Response);

    await handler(
      createEvent({
        taskId:
          'https://app.asana.com/1/25238013228946/project/1214128631444825/task/1214128635770002',
        fieldGid: 'field-2',
        fieldType: 'number',
        value: JSON.stringify(42),
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/1214128635770002?opt_fields='),
      expect.objectContaining({
        body: JSON.stringify({
          data: { custom_fields: { 'field-2': 42 } },
        }),
      })
    );
  });

  it('clears an enum field when the value is null', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: '1214128635770003',
          name: 'Task with cleared field',
          permalink_url: 'https://app.asana.com/0/1/1214128635770003/f',
          completed: false,
        },
      }),
    } as Response);

    await handler(
      createEvent({
        taskId: '1214128635770003',
        fieldGid: 'field-3',
        fieldType: 'enum',
        value: JSON.stringify(null),
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/1214128635770003?opt_fields='),
      expect.objectContaining({
        body: JSON.stringify({
          data: { custom_fields: { 'field-3': null } },
        }),
      })
    );
  });

  it('returns a validation error when task id is missing', async () => {
    const result = await handler(
      createEvent({
        fieldGid: 'field-1',
        value: JSON.stringify('value'),
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.taskIdRequired,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns a validation error when field gid is missing', async () => {
    const result = await handler(
      createEvent({
        taskId: '1214128635770001',
        value: JSON.stringify('value'),
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.customFieldRequired,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns a validation error when the value is not valid JSON', async () => {
    const result = await handler(
      createEvent({
        taskId: '1214128635770001',
        fieldGid: 'field-1',
        value: 'not-json',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.customFieldInvalidValue,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns the Asana API error message on failure', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        errors: [{ message: 'Custom field not found' }],
      }),
    } as Response);

    const result = await handler(
      createEvent({
        taskId: '1214128635770999',
        fieldGid: 'field-missing',
        value: JSON.stringify('value'),
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: 'Custom field not found',
    });
  });
});
