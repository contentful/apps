import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

const TREE_GUTTER_PX = 24;
const TREE_LINE_LEFT_PX = 10;
const TREE_H_BRANCH_PX = 14;
/** Approx. vertical center of a one-line card row for horizontal connector */
const TREE_CARD_ROW_CENTER_PX = 22;

export const treeChildRowBase = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingS,
  paddingLeft: `${TREE_GUTTER_PX}px`,
  paddingBottom: tokens.spacingS,
  boxSizing: 'border-box',
  '::before': {
    content: '""',
    position: 'absolute',
    left: `${TREE_LINE_LEFT_PX}px`,
    top: 0,
    width: '1px',
    backgroundColor: tokens.gray300,
    pointerEvents: 'none',
  },
  '::after': {
    content: '""',
    position: 'absolute',
    left: `${TREE_LINE_LEFT_PX}px`,
    top: `${TREE_CARD_ROW_CENTER_PX}px`,
    width: `${TREE_H_BRANCH_PX}px`,
    height: '1px',
    backgroundColor: tokens.gray300,
    pointerEvents: 'none',
  },
});

export const treeChildRowNotLast = css({
  '::before': {
    bottom: 0,
  },
});

export const treeChildRowLast = css({
  paddingBottom: 0,
  '::before': {
    bottom: 'auto',
    height: `${TREE_CARD_ROW_CENTER_PX}px`,
  },
});

export const treeChildrenList = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  '::before': {
    content: '""',
    position: 'absolute',
    left: `${TREE_LINE_LEFT_PX}px`,
    top: `calc(-1 * ${tokens.spacingS})`,
    width: '1px',
    height: tokens.spacingS,
    backgroundColor: tokens.gray300,
    pointerEvents: 'none',
  },
});
