import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  button: css({
    border: 'none',
    borderRadius: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingLeft: tokens.spacingM,
    paddingRight: tokens.spacingM,
    paddingBottom: tokens.spacing2Xs,
    maxWidth: 'none'
  }),
  selectedButton: css({
    border: 'none',
    borderRadius: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingLeft: tokens.spacingM,
    paddingRight: tokens.spacingM,
    paddingBottom: tokens.spacing2Xs,
    maxWidth: 'none',
    backgroundColor: tokens.gray200,
    '&:hover': {
        backgroundColor: tokens.gray200
    },
  }),
  modalContent: css({
    paddingTop: tokens.spacingS,
    paddingBottom: tokens.spacingS, 
    paddingRight: 0,
    paddingLeft: 0,
    maxHeight: '350px'
  }),
  skeleton: css({
    padding: tokens.spacingS
  }),
  skeletonBody: css({
    height: tokens.spacingL
  }),
  footer: css({
    border: `1px solid ${tokens.gray300}`
  })
};
