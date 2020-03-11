import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

export const styles = {
  field: css({
    display: 'flex',
    '> img': {
      marginRight: `${tokens.spacingXs}`
    },
    marginBottom: `${tokens.spacingS}`
  }),
  actionButtons: css({
    display: 'flex',
    alignItems: 'center',
    marginLeft: `${tokens.spacingXl}`,
    '> button': css({
      marginRight: `${tokens.spacingXl}`
    })
  })
};
