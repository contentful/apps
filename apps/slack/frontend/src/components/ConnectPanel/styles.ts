import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  connectWrapper: css({
    maxWidth: 450,
    margin: '0 auto',
  }),
  heading: css({
    marginBottom: tokens.spacingS,
  }),
  logo: css({
    width: 20,
    height: 20,
    marginRight: tokens.spacingS,
  }),
  addButtonWrapper: css({
    margin: `${tokens.spacingM} 0`,
  }),
  addButton: css({
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
  }),
};
