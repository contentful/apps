import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  body: css({
    height: 'auto',
    minHeight: '40vh',
    maxWidth: '900px',
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
  }),
  subheading: css({
    margin: 0,
  }),
};
