import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const HEADER_HEIGHT = 114;

const STICKY_HEADER_BREAKPOINT = 900;

function makeBodyStyle() {
  // Modal window height dynamically calculated in pixels.
  // Usage of css relative units was causing a bug with
  // multiple resizings of the modal window.
  const thirtyPerc = window.outerHeight * 0.3;
  const height = window.outerHeight - thirtyPerc - HEADER_HEIGHT;

  return css({
    height,
    padding: `${tokens.spacingL} ${tokens.spacingL} 0 ${tokens.spacingL}`,

    [`@media screen and (min-height: ${STICKY_HEADER_BREAKPOINT}px)`]: {
      padding: `calc(${tokens.spacingL} + ${HEADER_HEIGHT}px)  ${tokens.spacingL} 0 ${tokens.spacingL}`,
    },
  });
}

export const styles = {
  header: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: tokens.spacingL,

    [`@media screen and (min-height: ${STICKY_HEADER_BREAKPOINT}px)`]: {
      backgroundColor: 'white',
      position: 'fixed',
      top: 0,
      zIndex: 1,
      width: `calc(100% - 2rem)`,
    },
  }),
  body: makeBodyStyle(),
  total: css({
    fontSize: tokens.fontSizeS,
    color: tokens.gray600,
    display: 'block',
    marginTop: tokens.spacingS,
  }),
  saveBtn: css({
    marginRight: tokens.spacingM,
  }),
  paginator: css({
    margin: `${tokens.spacingM} auto ${tokens.spacingL} auto`,
    textAlign: 'center',
  }),
  leftsideControls: css({
    position: 'relative',
    zIndex: 0,
    svg: css({
      zIndex: 1,
      position: 'absolute',
      top: '10px',
      left: '10px',
    }),
    input: css({
      paddingLeft: '35px',
    }),
  }),
  rightsideControls: css({
    justifyContent: 'flex-end',
    flexGrow: 1,
    display: 'flex',
  }),
  loadMoreButton: css({
    marginTop: tokens.spacingXs,
  }),
};
