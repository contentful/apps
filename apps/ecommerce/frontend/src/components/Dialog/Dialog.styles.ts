import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const HEADER_HEIGHT = 114;

function makeBodyStyle() {
  // Modal window height dynamically calculated in pixels.
  // Usage of css relative units was causing a bug with
  // multiple resizings of the modal window.
  const thirtyPerc = window.outerHeight * 0.3;
  const height = window.outerHeight - thirtyPerc - HEADER_HEIGHT;

  return css({
    height,
    padding: `${tokens.spacingL} ${tokens.spacingL} 0 ${tokens.spacingL}`,
    overflow: 'auto',
  });
}

export const styles = {
  header: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    padding: `${tokens.spacingM} ${tokens.spacingXl}`,
    paddingRight: tokens.spacingL,
  }),
  body: makeBodyStyle(),
  productList: css({
    display: 'flex',
    flexWrap: 'wrap',
    marginLeft: tokens.spacingXs,
    marginRight: tokens.spacingXs,
    paddingBottom: tokens.spacingM,
  }),
  resourceCard: css({
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingXs,
  }),
  icon: css({
    display: 'flex',
    justifyContent: 'center',
    '> img': {
      display: 'block',
      width: '25px',
      margin: `${tokens.spacingXl} 0`,
    },
  }),
};
