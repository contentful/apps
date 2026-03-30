import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    width: '100%',
    maxWidth: '900px',
    marginTop: tokens.spacingXl,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: tokens.spacing2Xl,
    gap: tokens.spacingM,
  }),
};
