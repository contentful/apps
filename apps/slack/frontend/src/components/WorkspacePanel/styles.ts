import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  loadingText: css({
    height: tokens.spacingM,
    marginRight: '50px',
  }),
  paragraph: css({
    color: tokens.gray600,
    marginBottom: tokens.spacingM,
    '&:not(:last-child)': css({
      marginBottom: tokens.spacingM,
    }),
  }),
  note: css({
    marginBottom: tokens.spacingM,
  }),
  workbench: css({
    backgroundColor: tokens.gray100,
  }),
  panelMargin: css({
    marginBottom: tokens.spacingL,
  }),
  workspacePanel: css({
    display: 'flex',
    flexFlow: 'row nowrap',
    marginBottom: tokens.spacingL,
    justifyItems: 'space-between',
    alignItems: 'center',
  }),
  workspaceLogo: css({
    width: tokens.spacingXl,
    height: tokens.spacingXl,
    marginRight: tokens.spacingS,
    borderRadius: tokens.borderRadiusMedium,
    flexShrink: 0,
  }),
};
