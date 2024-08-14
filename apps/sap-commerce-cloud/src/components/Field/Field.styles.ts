import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  sortable: css({
    marginBottom: tokens.spacingM,
  }),
  container: css({
    display: 'flex',
  }),
  logo: css({
    display: 'block',
    height: '30px',
    marginRight: tokens.spacingM,
  }),
};
