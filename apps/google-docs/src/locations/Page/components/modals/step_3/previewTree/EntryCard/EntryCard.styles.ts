import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';

export const entryCardStyles = {
  card: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingXs,
    backgroundColor: tokens.colorWhite,
    transition: 'box-shadow 0.2s ease',
    flex: 1,
    alignSelf: 'center',
    zIndex: 1,
  }),
  rootCard: css({
    borderWidth: '2px',
    borderColor: tokens.gray400,
  }),

  circularCard: css({
    borderColor: tokens.orange400,
    backgroundColor: tokens.orange100,
  }),
  title: css({
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  circularIcon: css({
    flexShrink: 0,
  }),
};
