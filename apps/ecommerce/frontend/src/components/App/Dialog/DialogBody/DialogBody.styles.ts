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
  body: makeBodyStyle(),
};
