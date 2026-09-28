import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncFieldMappingsForEntry } from '../../functions/syncFieldMappings';
import { getProjectCustomFields, updateTaskCustomField } from '../../functions/asanaClient';
import { getTaskLinkForEntry } from '../../src/utils/taskLinkStore';
import type { AppInstallationParameters, AsanaCustomField } from '../../src/types';

vi.mock('../../functions/asanaClient', () => ({
  getProjectCustomFields: vi.fn(),
  updateTaskCustomField: vi.fn(),
}));

vi.mock('../../src/utils/taskLinkStore', () => ({
  getTaskLinkForEntry: vi.fn(),
}));

const mockCma = {} as PlainClientAPI;

function buildEntry(fields: Record<string, Record<string, unknown>>): EntryProps<KeyValueMap> {
  return {
    sys: {
      id: 'entry-1',
      contentType: { sys: { id: 'blogPost' } },
    },
    fields,
  } as unknown as EntryProps<KeyValueMap>;
}

function buildInstallationParameters(
  overrides: Partial<AppInstallationParameters> = {}
): AppInstallationParameters {
  return {
    defaultWorkspaceGid: 'workspace-1',
    defaultWorkspaceName: 'Workspace',
    defaultProjectGid: 'project-1',
    defaultProjectName: 'Project',
    fieldMappings: [
      {
        contentTypeId: 'blogPost',
        contentTypeName: 'Blog Post',
        contentfulFieldId: 'status',
        contentfulFieldName: 'Status',
        asanaCustomFieldGid: 'custom-field-1',
        asanaCustomFieldName: 'Address',
      },
    ],
    ...overrides,
  };
}

describe('syncFieldMappingsForEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTaskLinkForEntry).mockResolvedValue({
      entryId: 'entry-1',
      taskGid: 'task-1',
      taskUrl: 'https://app.asana.com/0/1/task-1/f',
      taskName: 'Task',
    });
  });

  it('skips entries with no field mappings for their content type', async () => {
    const entry = buildEntry({ status: { 'en-US': 'Live' } });
    const result = await syncFieldMappingsForEntry({
      cma: mockCma,
      entry,
      installationParameters: buildInstallationParameters({ fieldMappings: [] }),
      accessToken: 'token',
    });

    expect(result).toMatchObject({ success: true, updatedFieldCount: 0 });
    expect(getTaskLinkForEntry).not.toHaveBeenCalled();
  });

  it('skips entries that are not linked to an Asana task', async () => {
    vi.mocked(getTaskLinkForEntry).mockResolvedValue(null);
    const entry = buildEntry({ status: { 'en-US': 'Live' } });

    const result = await syncFieldMappingsForEntry({
      cma: mockCma,
      entry,
      installationParameters: buildInstallationParameters(),
      accessToken: 'token',
    });

    expect(result).toMatchObject({ success: true, updatedFieldCount: 0 });
    expect(getProjectCustomFields).not.toHaveBeenCalled();
  });

  it('syncs a text field mapping to its linked Asana task', async () => {
    vi.mocked(getProjectCustomFields).mockResolvedValue([
      { gid: 'custom-field-1', name: 'Address', type: 'text' },
    ] as AsanaCustomField[]);
    const entry = buildEntry({ status: { 'en-US': '123 Main St' } });

    const result = await syncFieldMappingsForEntry({
      cma: mockCma,
      entry,
      installationParameters: buildInstallationParameters(),
      accessToken: 'token',
    });

    expect(updateTaskCustomField).toHaveBeenCalledWith(
      'token',
      'task-1',
      'custom-field-1',
      '123 Main St'
    );
    expect(result).toMatchObject({ success: true, updatedFieldCount: 1 });
  });

  it('converts a matching enum mapping into the option gid', async () => {
    vi.mocked(getProjectCustomFields).mockResolvedValue([
      {
        gid: 'custom-field-1',
        name: 'Single Select',
        type: 'enum',
        enumOptions: [
          { gid: 'option-1', name: 'Option 1' },
          { gid: 'option-2', name: 'Option 2' },
        ],
      },
    ] as AsanaCustomField[]);
    const entry = buildEntry({ status: { 'en-US': 'Option 2' } });

    const result = await syncFieldMappingsForEntry({
      cma: mockCma,
      entry,
      installationParameters: buildInstallationParameters(),
      accessToken: 'token',
    });

    expect(updateTaskCustomField).toHaveBeenCalledWith(
      'token',
      'task-1',
      'custom-field-1',
      'option-2'
    );
    expect(result).toMatchObject({ success: true, updatedFieldCount: 1 });
  });

  it('skips a mapping when the target custom field no longer exists on the project', async () => {
    vi.mocked(getProjectCustomFields).mockResolvedValue([]);
    const entry = buildEntry({ status: { 'en-US': '123 Main St' } });

    const result = await syncFieldMappingsForEntry({
      cma: mockCma,
      entry,
      installationParameters: buildInstallationParameters(),
      accessToken: 'token',
    });

    expect(updateTaskCustomField).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, updatedFieldCount: 0 });
  });
});
