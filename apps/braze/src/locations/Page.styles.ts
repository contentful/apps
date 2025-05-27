import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

const baseTableCell = {
  paddingTop: tokens.spacingXs,
  paddingBottom: tokens.spacingXs,
};

export const styles = {
  container: css({
    background: tokens.colorWhite,
    minHeight: '100vh',
    width: '100%',
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
  }),
  subheading: css({
    margin: 0,
    fontSize: tokens.fontSizeM,
  }),
  emptyComponentContainer: css({ minHeight: '80vh' }),
  buttonCell: css({
    width: '6rem',
  }),
  loading: css({
    height: '80vh',
  }),
  modalMainContainer: css({
    minWidth: 400,
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
  modalConnectedFieldsContainer: css({
    border: `1px solid ${tokens.gray300}`,
    boxShadow: 'none',
  }),
  viewEntryButton: css({
    marginLeft: tokens.spacingL,
  }),
  baseCell: css({
    ...baseTableCell,
  }),
  checkboxCell: css({
    ...baseTableCell,
    width: 40,
  }),
  boldCell: css({
    ...baseTableCell,
    fontWeight: 'bold',
  }),
};
