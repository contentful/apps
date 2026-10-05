import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { PlainClientAPI } from 'contentful-management';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALIDATION_MESSAGES } from '../../src/const';
import type { AppInstallationParameters, SyncAsanaTaskFromEntryRequest } from '../../src/types';
import { handler } from '../../functions/syncAsanaTaskFromEntry';

globalThis.fetch = vi.fn();

describe('syncAsanaTaskFromEntry handler', () => {
  const mockCma = {
    entry: {
      getMany: vi.fn(),
    },
    locale: {
      getMany: vi.fn(),
    },
  } as unknown as PlainClientAPI;

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
    cma: mockCma,
    spaceId: 'test-space',
    environmentId: 'test-env',
    oauthSdk: mockOauthSdk,
  } as unknown as FunctionEventContext;

  const createEvent = (
    body: SyncAsanaTaskFromEntryRequest
  ): AppActionRequest<'Custom', SyncAsanaTaskFromEntryRequest> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    } as AppActionRequest<'Custom', SyncAsanaTaskFromEntryRequest>);

  const linkedTaskItems = [
    {
      sys: { id: 'link-entry-1' },
      fields: {
        contentfulEntryId: { 'en-US': 'entry-1' },
        taskGid: { 'en-US': 'task-linked' },
        taskUrl: { 'en-US': 'https://app.asana.com/0/1/task-linked/f' },
        taskName: { 'en-US': 'Linked task' },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockOauthSdk.token.mockResolvedValue({
      tokenType: 'bearer',
      accessToken: 'test-access-token',
      expiry: 3600,
    });
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({ items: [] } as never);
    vi.mocked(mockCma.locale.getMany).mockResolvedValue({
      items: [{ code: 'en-US', default: true }],
    } as never);
  });

  it('returns a validation error when entryId is missing', async () => {
    const result = await handler(
      createEvent({ completed: true }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.entryIdRequired,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns a validation error when neither completed nor sectionGid is provided', async () => {
    const result = await handler(
      createEvent({ entryId: 'entry-1' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.taskUpdateFieldsRequired,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns an entryNotLinked error when the entry has no linked task', async () => {
    const result = await handler(
      createEvent({ entryId: 'entry-unlinked', completed: true }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: VALIDATION_MESSAGES.entryNotLinked,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('marks the linked task complete', async () => {
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({ items: linkedTaskItems } as never);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: 'task-linked',
          name: 'Linked task',
          permalink_url: 'https://app.asana.com/0/1/task-linked/f',
        },
      }),
    } as Response);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: 'task-linked',
          name: 'Linked task',
          permalink_url: 'https://app.asana.com/0/1/task-linked/f',
          completed: true,
        },
      }),
    } as Response);

    const result = await handler(
      createEvent({ entryId: 'entry-1', completed: true }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toMatchObject({
      success: true,
      message: VALIDATION_MESSAGES.taskUpdated,
      task: expect.objectContaining({ gid: 'task-linked', completed: true }),
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/task-linked?opt_fields=gid,name,permalink_url'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ data: { completed: true } }),
      })
    );
  });

  it('moves the linked task to a new section', async () => {
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({ items: linkedTaskItems } as never);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: 'task-linked',
          name: 'Linked task',
          permalink_url: 'https://app.asana.com/0/1/task-linked/f',
          completed: false,
        },
      }),
    } as Response);

    const result = await handler(
      createEvent({ entryId: 'entry-1', sectionGid: 'section-2' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toMatchObject({
      success: true,
      message: VALIDATION_MESSAGES.taskUpdated,
    });
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/sections/section-2/addTask',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ data: { task: 'task-linked' } }),
      })
    );
  });

  it('updates title, notes, assignee, and due date on the linked task', async () => {
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({ items: linkedTaskItems } as never);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: 'task-linked',
          name: 'Updated title',
          permalink_url: 'https://app.asana.com/0/1/task-linked/f',
        },
      }),
    } as Response);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          gid: 'task-linked',
          name: 'Updated title',
          permalink_url: 'https://app.asana.com/0/1/task-linked/f',
          completed: false,
        },
      }),
    } as Response);

    const result = await handler(
      createEvent({
        entryId: 'entry-1',
        title: 'Updated title',
        notes: 'Updated notes',
        assignee: 'user-1',
        dueDate: '2026-10-01',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toMatchObject({
      success: true,
      message: VALIDATION_MESSAGES.taskUpdated,
    });
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/tasks/task-linked?opt_fields=gid,name,permalink_url'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          data: {
            name: 'Updated title',
            notes: 'Updated notes',
            assignee: 'user-1',
            due_on: '2026-10-01',
          },
        }),
      })
    );
  });

  it('returns the tokenRequired error when Asana is not connected', async () => {
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({ items: linkedTaskItems } as never);
    mockOauthSdk.token.mockRejectedValueOnce(new Error('not connected'));

    await expect(
      handler(
        createEvent({ entryId: 'entry-1', completed: true }) as Parameters<typeof handler>[0],
        mockContext
      )
    ).rejects.toThrow(VALIDATION_MESSAGES.tokenRequired);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns the Asana API error message on failure', async () => {
    vi.mocked(mockCma.entry.getMany).mockResolvedValue({ items: linkedTaskItems } as never);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        errors: [{ message: 'Task not found' }],
      }),
    } as Response);

    const result = await handler(
      createEvent({ entryId: 'entry-1', completed: true }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: 'Task not found',
    });
  });
});
