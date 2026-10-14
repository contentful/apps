import { describe, expect, it } from 'vitest';
import {
  buildPrimaryTaskLinkFromEntryValues,
  getDefaultPrimaryTaskLinkMapping,
  getEligiblePrimaryTaskLinkFields,
  getMappedPrimaryTaskLinkFieldIds,
  getPrimaryTaskLinkMapping,
} from '../../src/utils/primaryTaskLink';

describe('primaryTaskLink utils', () => {
  it('returns the configured mapping for a content type', () => {
    expect(
      getPrimaryTaskLinkMapping(
        {
          personalAccessToken: '',
          defaultWorkspaceGid: '',
          defaultWorkspaceName: '',
          defaultProjectGid: '',
          defaultProjectName: '',
          primaryTaskLinkMappings: {
            blogPost: {
              taskGidFieldId: 'asanaTaskGid',
              taskUrlFieldId: 'asanaTaskUrl',
              taskNameFieldId: 'asanaTaskName',
            },
          },
        },
        'blogPost'
      )
    ).toEqual({
      taskGidFieldId: 'asanaTaskGid',
      taskUrlFieldId: 'asanaTaskUrl',
      taskNameFieldId: 'asanaTaskName',
    });
  });

  it('prefers the canonical object field over a stale configured legacy mapping', () => {
    expect(
      getPrimaryTaskLinkMapping(
        {
          personalAccessToken: '',
          defaultWorkspaceGid: '',
          defaultWorkspaceName: '',
          defaultProjectGid: '',
          defaultProjectName: '',
          primaryTaskLinkMappings: {
            blogPost: {
              taskGidFieldId: 'asanaTaskGid',
              taskUrlFieldId: 'asanaTaskUrl',
              taskNameFieldId: 'asanaTaskName',
            },
          },
        },
        'blogPost',
        [
          { id: 'asanaTaskLink', name: 'Primary Asana Task', type: 'Object' },
          { id: 'asanaTaskGid', name: 'Asana Task GID', type: 'Symbol' },
          { id: 'asanaTaskUrl', name: 'Asana Task URL', type: 'Symbol' },
          { id: 'asanaTaskName', name: 'Asana Task Name', type: 'Symbol' },
        ]
      )
    ).toEqual({
      objectFieldId: 'asanaTaskLink',
      taskGidFieldId: 'asanaTaskGid',
      taskUrlFieldId: 'asanaTaskUrl',
      taskNameFieldId: 'asanaTaskName',
    });
  });

  it('falls back to standard Asana field ids when they exist', () => {
    expect(
      getPrimaryTaskLinkMapping(
        {
          personalAccessToken: '',
          defaultWorkspaceGid: '',
          defaultWorkspaceName: '',
          defaultProjectGid: '',
          defaultProjectName: '',
        },
        'blogPost',
        [
          { id: 'asanaTaskGid', name: 'Asana Task GID', type: 'Symbol' },
          { id: 'asanaTaskUrl', name: 'Asana Task URL', type: 'Symbol' },
          { id: 'asanaTaskName', name: 'Asana Task Name', type: 'Symbol' },
        ]
      )
    ).toEqual({
      taskGidFieldId: 'asanaTaskGid',
      taskUrlFieldId: 'asanaTaskUrl',
      taskNameFieldId: 'asanaTaskName',
    });
  });

  it('detects the default primary task link mapping from standard field ids', () => {
    expect(
      getDefaultPrimaryTaskLinkMapping([
        { id: 'asanaTaskGid', name: 'Asana Task GID', type: 'Symbol' },
        { id: 'asanaTaskUrl', name: 'Asana Task URL', type: 'Symbol' },
        { id: 'asanaTaskName', name: 'Asana Task Name', type: 'Symbol' },
      ])
    ).toEqual({
      taskGidFieldId: 'asanaTaskGid',
      taskUrlFieldId: 'asanaTaskUrl',
      taskNameFieldId: 'asanaTaskName',
    });
  });

  it('prefers the canonical object field when it exists', () => {
    expect(
      getDefaultPrimaryTaskLinkMapping([
        { id: 'asanaTaskLink', name: 'Primary Asana Task', type: 'Object' },
        { id: 'asanaTaskGid', name: 'Asana Task GID', type: 'Symbol' },
        { id: 'asanaTaskUrl', name: 'Asana Task URL', type: 'Symbol' },
        { id: 'asanaTaskName', name: 'Asana Task Name', type: 'Symbol' },
      ])
    ).toEqual({
      objectFieldId: 'asanaTaskLink',
      taskGidFieldId: 'asanaTaskGid',
      taskUrlFieldId: 'asanaTaskUrl',
      taskNameFieldId: 'asanaTaskName',
    });
  });

  it('filters link storage fields to text-compatible field types', () => {
    expect(
      getEligiblePrimaryTaskLinkFields([
        { id: 'title', name: 'Title', type: 'Symbol' },
        { id: 'description', name: 'Description', type: 'Text' },
        { id: 'publishDate', name: 'Publish Date', type: 'Date' },
      ])
    ).toEqual([
      { id: 'title', name: 'Title', type: 'Symbol' },
      { id: 'description', name: 'Description', type: 'Text' },
    ]);
  });

  it('builds a primary task link from mapped entry values', () => {
    expect(
      buildPrimaryTaskLinkFromEntryValues(
        {
          asanaTaskGid: '12345',
          asanaTaskUrl: 'https://app.asana.com/0/12345',
          asanaTaskName: 'Landing page review',
        },
        {
          taskGidFieldId: 'asanaTaskGid',
          taskUrlFieldId: 'asanaTaskUrl',
          taskNameFieldId: 'asanaTaskName',
        }
      )
    ).toEqual({
      entryId: '',
      taskGid: '12345',
      taskUrl: 'https://app.asana.com/0/12345',
      taskName: 'Landing page review',
    });
  });

  it('builds a primary task link from the canonical object field', () => {
    expect(
      buildPrimaryTaskLinkFromEntryValues(
        {
          asanaTaskLink: {
            taskGid: '12345',
            taskUrl: 'https://app.asana.com/0/12345',
            taskName: 'Landing page review',
            taskDescription: 'Canonical description from Asana.',
          },
        },
        {
          objectFieldId: 'asanaTaskLink',
          taskGidFieldId: 'asanaTaskGid',
          taskUrlFieldId: 'asanaTaskUrl',
          taskNameFieldId: 'asanaTaskName',
        }
      )
    ).toEqual({
      entryId: '',
      taskGid: '12345',
      taskUrl: 'https://app.asana.com/0/12345',
      taskName: 'Landing page review',
      taskDescription: 'Canonical description from Asana.',
    });
  });

  it('falls back to legacy fields when the object field is empty', () => {
    expect(
      buildPrimaryTaskLinkFromEntryValues(
        {
          asanaTaskLink: {},
          asanaTaskGid: '12345',
          asanaTaskUrl: 'https://app.asana.com/0/12345',
          asanaTaskName: 'Landing page review',
        },
        {
          objectFieldId: 'asanaTaskLink',
          taskGidFieldId: 'asanaTaskGid',
          taskUrlFieldId: 'asanaTaskUrl',
          taskNameFieldId: 'asanaTaskName',
        }
      )
    ).toEqual({
      entryId: '',
      taskGid: '12345',
      taskUrl: 'https://app.asana.com/0/12345',
      taskName: 'Landing page review',
    });
  });

  it('returns only the object field id for entry field assignment when present', () => {
    expect(
      getMappedPrimaryTaskLinkFieldIds({
        objectFieldId: 'asanaTaskLink',
        taskGidFieldId: 'asanaTaskGid',
        taskUrlFieldId: 'asanaTaskUrl',
        taskNameFieldId: 'asanaTaskName',
      })
    ).toEqual(['asanaTaskLink']);
  });

  it('returns null when the mapped values are incomplete', () => {
    expect(
      buildPrimaryTaskLinkFromEntryValues(
        {
          asanaTaskGid: '12345',
          asanaTaskUrl: '',
          asanaTaskName: 'Landing page review',
        },
        {
          taskGidFieldId: 'asanaTaskGid',
          taskUrlFieldId: 'asanaTaskUrl',
          taskNameFieldId: 'asanaTaskName',
        }
      )
    ).toBeNull();
  });
});
