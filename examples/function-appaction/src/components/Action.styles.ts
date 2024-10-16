import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  accordion: css({
    marginTop: tokens.spacingM,
  }),
  accordionTitleFailure: css({
    color: tokens.colorNegative,
    fontWeight: tokens.fontWeightDemiBold,
  }),
  accordionTitleSuccess: css({
    color: tokens.colorPositive,
    fontWeight: tokens.fontWeightDemiBold,
  }),
  accordionTitleMargin: css({
    marginLeft: tokens.spacing2Xs,
  }),
  subAccordionTitle: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
  requestHeaders: css({
    marginLeft: tokens.spacingXs,
    wordWrap: 'break-word',
  }),
  bodyContainer: css({
    alignItems: 'center',
    position: 'relative',
  }),
  body: css({
    minWidth: '100%',
    overflowX: 'auto',
    padding: '8px',
    border: `1px solid ${tokens.gray200}`,
    borderRadius: '4px',
    backgroundColor: tokens.gray100,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  }),
  copyButton: css({
    marginLeft: '8px',
    position: 'absolute',
    right: '0px',
    top: '14px',
  }),
};
