import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  header: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    padding: `${tokens.spacingM} ${tokens.spacingXl}`,
    paddingRight: tokens.spacingL,
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
