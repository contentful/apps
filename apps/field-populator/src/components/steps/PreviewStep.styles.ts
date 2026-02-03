import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  previewSection: css({
    border: '1px solid #e5ebed',
    borderRadius: '6px',
  }),
  localeList: css({
    marginTop: '4px',
    paddingLeft: '16px',
  }),
  fieldBox: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusSmall,
  }),
};
