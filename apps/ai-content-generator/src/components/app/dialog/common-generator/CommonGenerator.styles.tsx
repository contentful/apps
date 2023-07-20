import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  fieldSelectorRoot: css({
    borderLeft: `1px solid ${tokens.gray200}`,
    borderRight: `1px solid ${tokens.gray200}`,
    flexGrow: 1,
  }),
  root: css({
    display: 'flex',
    minHeight: '500px',
  }),
};
