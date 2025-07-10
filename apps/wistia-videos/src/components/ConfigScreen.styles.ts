import css from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const styles = {
  projectMenu: css({
    position: 'relative',
    margin: '0.1rem',
  }),
  body: css({ paddingTop: 0 }),
  form: css({
    maxWidth: tokens.contentWidthDefault,
    margin: `${tokens.spacingL} auto 0`,
  }),
};
