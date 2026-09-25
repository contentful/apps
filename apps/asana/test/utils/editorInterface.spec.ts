import { describe, expect, it } from 'vitest';
import { buildEditorInterfaceTargetState } from '../../src/utils/editorInterface';

describe('buildEditorInterfaceTargetState', () => {
  it('assigns the sidebar to selected content types', () => {
    expect(buildEditorInterfaceTargetState({}, ['blogPost'])).toEqual({
      blogPost: {
        sidebar: {
          position: 1,
        },
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
          },
        },
        ['blogPost']
      )
    ).toEqual({
      blogPost: {
        editors: {
          position: 0,
        },
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
      },
    });
  });
});
