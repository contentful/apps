import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    minHeight: '340px',
  }),
  stickyFooter: css({
    position: 'sticky',
    bottom: 0,
    backgroundColor: tokens.colorWhite,
    paddingTop: tokens.spacingM,
    paddingBottom: tokens.spacingM,
    marginTop: 'auto',
    borderTop: `1px solid ${tokens.gray200}`,
  }),
};
