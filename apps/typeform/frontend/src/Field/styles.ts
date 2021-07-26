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
  logo: css({
    width: '40px',
    height: '40px'
  }),
  actionButtons: css({
    display: 'flex',
    alignItems: 'center',
    marginLeft: `${tokens.spacing2Xl}`,
    '> button': css({
      marginRight: `${tokens.spacingXl}`
    }),
    marginBottom: tokens.spacingXs
  }),
  editButton: css({
    marginRight: tokens.spacingL,
    svg: {
      width: '16px',
      height: '16px'
    }
  }),
  previewButton: (disabled: boolean) =>
    css({
      marginRight: tokens.spacingL,
      button: {
        display: 'flex'
      },
      svg: {
        fill: tokens.colorPrimary,
        transition: `fill ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
        overflow: 'visible',
        marginRight: tokens.spacing2Xs
      },
      '&:hover': {
        svg: {
          fill: disabled ? tokens.colorPrimary : tokens.gray900
        }
      }
    })
};
