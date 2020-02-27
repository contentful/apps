import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const HEADER_HEIGHT = 114;

const SHOULD_HAVE_STICKY_HEADER = window.outerHeight >= 900;

function makeBodyStyle() {
  // Modal window height dynamically calculated in pixels.
  // Usage of css relative units was causing a bug with
  // multiple resizings of the modal window.
  const twentyPerc = window.outerHeight * 0.3;
  const height = window.outerHeight - twentyPerc - HEADER_HEIGHT;

  const padding = SHOULD_HAVE_STICKY_HEADER
    ? `calc(${tokens.spacingL} + ${HEADER_HEIGHT}px)  ${tokens.spacingL} 0 ${tokens.spacingL}`
    : `${tokens.spacingL} ${tokens.spacingL} 0 ${tokens.spacingL}`;

  return css({ height, padding });
}

export const styles = {
  header: css({
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    display: 'flex',
    justifyContent: 'space-between',
    padding: tokens.spacingL,
    ...(SHOULD_HAVE_STICKY_HEADER && {
      backgroundColor: 'white',
      position: 'fixed',
      top: 0,
      zIndex: 1,
      width: `calc(100% - 2rem)`
    })
  }),
  body: makeBodyStyle(),
  total: css({
    fontSize: tokens.fontSizeS,
    color: tokens.colorTextLight,
    display: 'block',
    marginTop: tokens.spacingS
  }),
  saveBtn: css({
    marginRight: tokens.spacingM
  }),
  paginator: css({
    margin: `${tokens.spacingM} auto ${tokens.spacingL} auto`,
    textAlign: 'center'
  }),
  leftsideControls: css({
    position: 'relative',
    zIndex: 0,
    svg: css({
      zIndex: 1,
      position: 'absolute',
      top: '10px',
      left: '10px'
    }),
    input: css({
      paddingLeft: '35px'
    })
  }),
  rightsideControls: css({
    justifyContent: 'flex-end',
    flexGrow: 1,
    display: 'flex'
  }),
  loadMoreButton: css({
    width: '100%',
    marginTop: tokens.spacingXs
  })
};
