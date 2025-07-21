import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

const baseTableCell = {
  paddingTop: tokens.spacingS,
  paddingBottom: tokens.spacingXs,
};

export const styles = {
  modalMainContainer: css({
    minWidth: 400,
    maxHeight: '50vh',
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
  badgeStyle: css({
    marginLeft: 'auto',
    alignSelf: 'center',
  }),
  warningIconNote: css({
    width: 20,
    height: 20,
    color: tokens.colorNegative,
  }),
  warningIconBadge: css({
    width: 14,
    height: 14,
  }),
};
