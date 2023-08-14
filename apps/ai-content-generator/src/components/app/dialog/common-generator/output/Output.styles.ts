import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

const TAB_WIDTH = 145;
const HEADER_HEIGHT = 160;
const MODAL_MIN_HEIGHT = 600;

function makeOutputStyle() {
  // Output section height dynamically calculated in pixels
  const twentyFivePerc = window.outerHeight * 0.25;
  const height = window.outerHeight - twentyFivePerc - HEADER_HEIGHT;
  const minHeight = MODAL_MIN_HEIGHT - HEADER_HEIGHT;

  return css({
    minHeight: minHeight,
    height,
    overflow: 'auto',
    margin: `0 ${tokens.spacingL}`,
  });
}

export const styles = {
  output: makeOutputStyle(),
  tabsContainer: css({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: `${tokens.spacingL}`,
  }),
  tabsList: css({
    justifyContent: 'flex-end',
    padding: `${tokens.spacingS} ${tokens.spacing2Xl} 0 ${tokens.spacing2Xl}`,
  }),
  tab: css({
    width: TAB_WIDTH,
    justifyContent: 'center',
  }),
};
