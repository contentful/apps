import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
    itemWrapper: (withMargin: boolean) =>
      css({
        marginBottom: tokens.spacingL,
        paddingBottom: withMargin ? tokens.spacingL : '0',
        borderBottom: `1px solid ${tokens.gray300}`,
      }),
    item: css({
      display: 'flex',
      flexFlow: 'row nowrap',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    }),
    notifiesIn: css({
      lineHeight: '18px',
      margin: `11px ${tokens.spacingL} calc(${tokens.spacingM} + 11px) ${tokens.spacingL}`,
    }),
    select: css({
      flex: 1,
      marginBottom: tokens.spacingM,
    }),
    delete: css({
      height: tokens.spacingXl,
      margin: `0 0 ${tokens.spacingM} ${tokens.spacingS}`,
      padding: `0 ${tokens.spacing2Xs}`,
    }),
    channelInput: css({
        textOverflow: 'ellipsis'
    }),
    spinner: css({
        height: '40px'
    })
  };