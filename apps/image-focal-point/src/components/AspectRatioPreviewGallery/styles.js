import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  heading: css({
    marginBottom: tokens.spacingXs,
  }),
  gallery: css({
    display: 'flex',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: tokens.spacingM,
  }),
  preview: css({
    '& > div': {
      backgroundColor: tokens.gray200,
      borderRadius: tokens.borderRadiusSmall,
    },
    '& img': {
      display: 'block',
    },
  }),
};
