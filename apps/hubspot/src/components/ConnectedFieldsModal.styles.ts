import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

const baseTableCell = {
  paddingTop: tokens.spacingS,
  paddingBottom: tokens.spacingXs,
};

export const styles = {
  modalHeaderFrame: css({
    paddingTop: tokens.spacingS,
  }),
  modalContentFrame: css({
    paddingTop: tokens.spacingS,
    paddingLeft: tokens.spacing2Xs,
    paddingRight: tokens.spacing2Xs,
    paddingBottom: tokens.spacing2Xs,
  }),
  modalMainContainer: css({
    minWidth: 400,
    maxHeight: '50vh',
  }),
  modalErrorBanner: css({
    background: tokens.red100,
    border: `1px solid ${tokens.red500}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingM,
    marginBottom: tokens.spacingS,
    color: tokens.red700,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2Xs,
  }),
  modalErrorTitle: css({
    color: tokens.red700,
    fontWeight: 'bold',
    fontSize: tokens.fontSizeM,
    marginBottom: tokens.spacing2Xs,
  }),
  modalErrorMessage: css({
    color: tokens.red700,
    fontSize: tokens.fontSizeS,
  }),
  modalEntryContainer: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorWhite,
    padding: tokens.spacingS,
    marginBottom: tokens.spacingM,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingM,
  }),
  viewEntryButton: css({
    marginLeft: tokens.spacingL,
  }),
  baseCell: css({
    ...baseTableCell,
    paddingLeft: 0,
    verticalAlign: 'middle',
  }),
  checkboxCell: css({
    ...baseTableCell,
    width: 40,
    paddingRight: tokens.spacingXs,
    verticalAlign: 'middle',
  }),
};
