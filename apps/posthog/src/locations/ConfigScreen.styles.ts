import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const CONFIG_SCREEN_MAX_WIDTH = '800px';

export const styles = {
  body: css({
    height: 'auto',
    minHeight: '40vh',
    maxWidth: CONFIG_SCREEN_MAX_WIDTH,
    marginTop: tokens.spacing2Xl,
    marginBottom: tokens.spacing2Xl,
  }),
  section: css({
    marginBottom: tokens.spacing2Xl,
  }),
  sectionHeader: css({
    marginBottom: tokens.spacingS,
  }),
  form: css({
    marginTop: tokens.spacingM,
  }),
  formField: css({
    marginBottom: tokens.spacingM,
  }),
  hostSelector: css({
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingS,
  }),
  hostOption: css({
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingXs,
  }),
  customHostInput: css({
    marginTop: tokens.spacingS,
    marginLeft: tokens.spacingL,
  }),
  connectionStatus: css({
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingXs,
    marginTop: tokens.spacingM,
  }),
  connectionSuccess: css({
    color: tokens.colorPositive,
  }),
  connectionError: css({
    color: tokens.colorNegative,
  }),
  contentTypeMapping: css({
    marginTop: tokens.spacingL,
  }),
  contentTypeMappingRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingM,
    marginBottom: tokens.spacingS,
    padding: tokens.spacingS,
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
  }),
  contentTypeName: css({
    flex: '0 0 200px',
    fontWeight: tokens.fontWeightDemiBold,
  }),
  fieldSelect: css({
    flex: 1,
  }),
  helpText: css({
    color: tokens.gray600,
    fontSize: tokens.fontSizeS,
    marginTop: tokens.spacing2Xs,
  }),
  divider: css({
    borderTop: `1px solid ${tokens.gray300}`,
    marginTop: tokens.spacing2Xl,
    marginBottom: tokens.spacing2Xl,
  }),
  testButton: css({
    marginTop: tokens.spacingM,
  }),
};
