import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: `${tokens.spacingXl} auto`,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: '900px',
    backgroundColor: tokens.colorWhite,
    borderRadius: '6px',
    border: `1px solid ${tokens.gray300}`,
    zIndex: 2,
  }),
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),
};
