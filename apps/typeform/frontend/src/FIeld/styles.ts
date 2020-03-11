import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { makeEyeIcon } from './makeEyeIcon';

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
    }),
    marginBottom: tokens.spacingXs,
  }),
  previewButton: css({
    marginRight: tokens.spacingL,
  }),
  previewButtonTextLink: css({
    display: 'flex',
    alignItems: 'center',
    '&:before': {
      content: `url('${makeEyeIcon('primary')}')`,
      display: 'flex',
      alignItems: 'center',
      width: '18px',
      height: '18px',
      marginRight: tokens.spacingXs,
      transform: 'scale(0.9)'
    },
    '&:hover': {
      '&:before': {
        content: `url('${makeEyeIcon('dark')}')`,
      }
    }
  })
};
