import { css } from 'emotion';

/**
 * Rich Text Editor - Sticky Toolbar
 * Makes the formatting toolbar remain visible when scrolling through content
 */

// CSS custom properties for configuration
const rteEditorMaxHeight = '500px';
const rteToolbarZIndex = 100;

export const styles = {
  richTextEditorContainer: css({
    position: 'relative',
    overflow: 'visible',

    // Sticky toolbar positioning
    '& > div > div:first-child > div': {
      position: 'sticky',
      top: 0,
      zIndex: rteToolbarZIndex,
    },

    // Scrollable editor content area
    '& [data-slate-editor="true"]': {
      maxHeight: rteEditorMaxHeight,
      overflowY: 'auto',
      overflowX: 'hidden',
      // Smooth scrolling for better UX
      scrollBehavior: 'smooth',
      // Prevent scroll chaining to parent
      overscrollBehavior: 'contain',
    },
  }),
};
