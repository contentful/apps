import { describe, expect, it } from 'vitest';
import { buildEditorInterfaceTargetState } from '../../src/utils/editorInterface';

describe('buildEditorInterfaceTargetState', () => {
  it('assigns the sidebar to selected content types', () => {
    expect(buildEditorInterfaceTargetState({}, ['blogPost'])).toEqual({
      blogPost: {
        sidebar: {
          position: 1,
        },
        controls: [],
      },
    });
  });

  it('preserves existing editor interface configuration while adding a sidebar', () => {
    expect(
      buildEditorInterfaceTargetState(
        {
          blogPost: {
            editors: {
              position: 0,
            },
            controls: [{ fieldId: 'title' }],
          },
        },
        ['blogPost']
      )
    ).toEqual({
      blogPost: {
        editors: {
          position: 0,
        },
        controls: [],
        sidebar: {
          position: 1,
        },
      },
    });
  });

  it('keeps an existing sidebar configuration intact', () => {
    expect(
      buildEditorInterfaceTargetState(
        {
          blogPost: {
            sidebar: {
              position: 2,
            },
          },
        },
        ['blogPost']
      )
    ).toEqual({
      blogPost: {
        sidebar: {
          position: 2,
        },
        controls: [],
      },
    });
  });

  it('assigns mapped fields to the entry field location controls', () => {
    expect(
      buildEditorInterfaceTargetState({}, ['blogPost'], {
        blogPost: {
          taskGidFieldId: 'asanaTaskGid',
          taskUrlFieldId: 'asanaTaskUrl',
          taskNameFieldId: 'asanaTaskName',
        },
      })
    ).toEqual({
      blogPost: {
        sidebar: {
          position: 1,
        },
        controls: [
          { fieldId: 'asanaTaskGid' },
          { fieldId: 'asanaTaskUrl' },
          { fieldId: 'asanaTaskName' },
        ],
      },
    });
  });

  it('prefers the canonical object field when one is configured', () => {
    expect(
      buildEditorInterfaceTargetState({}, ['blogPost'], {
        blogPost: {
          objectFieldId: 'asanaTaskLink',
          taskGidFieldId: 'asanaTaskGid',
          taskUrlFieldId: 'asanaTaskUrl',
          taskNameFieldId: 'asanaTaskName',
        },
      })
    ).toEqual({
      blogPost: {
        sidebar: {
          position: 1,
        },
        controls: [{ fieldId: 'asanaTaskLink' }],
      },
    });
  });
});
