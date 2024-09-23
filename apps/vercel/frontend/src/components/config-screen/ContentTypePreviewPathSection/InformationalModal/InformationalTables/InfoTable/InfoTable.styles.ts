import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';
import { INFORMATIONAL_MODAL_COLUMN_WIDTH } from '@constants/styles';

export const styles = {
  headersWrapper: css({
    borderBottom: `1px solid ${tokens.gray200}`,
    paddingRight: tokens.spacing2Xl,
  }),
  header: css({
    margin: `0 ${tokens.spacingXs}`,
    width: INFORMATIONAL_MODAL_COLUMN_WIDTH,
    color: tokens.gray700,
    fontWeight: tokens.fontWeightMedium,
  }),
  headerWithBorder: css({
    width: INFORMATIONAL_MODAL_COLUMN_WIDTH,
    borderLeft: `1px solid ${tokens.gray200}`,
    paddingLeft: tokens.spacingM,
    marginBottom: 0,
    color: tokens.gray700,
    fontWeight: tokens.fontWeightMedium,
  }),
  rowWrapper: css({
    borderBottom: `1px solid ${tokens.gray200}`,
    paddingRight: tokens.spacingM,
  }),
  rowDescription: css({
    paddingLeft: tokens.spacingM,
    paddingTop: tokens.spacing2Xs,
    paddingBottom: tokens.spacing2Xs,
    margin: 0,
  }),
  rowDescriptionWrapper: css({
    borderLeft: `1px solid ${tokens.gray200}`,
    padding: `${tokens.spacing2Xs} 0`,
  }),
};
