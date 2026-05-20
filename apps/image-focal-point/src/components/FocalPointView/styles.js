import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: tokens.spacingM,
  }),
  controls: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingXs,
  }),
  input: css({
    maxWidth: '280px',
  }),
  button: css({
    marginRight: tokens.spacingXs,
  }),
};
