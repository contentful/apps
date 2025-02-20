import { css } from 'emotion';

function makeDialogStyle() {
  const thirtyPerc = window.outerHeight * 0.3;
  const height = window.outerHeight - thirtyPerc;

  return css({
    height,
  });
}

export const styles = {
  dialog: makeDialogStyle(),
  missingContent: css({
    paddingLeft: 0,
  }),
};
