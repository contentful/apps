import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

const tableCellChromeBase = css({
  display: 'inline-block',
  width: 'fit-content',
  maxWidth: '100%',
  verticalAlign: 'top',
  boxSizing: 'border-box',
  borderRadius: tokens.borderRadiusMedium,
  padding: tokens.spacing2Xs,
});

export const tableCellChromeMapped = css([
  tableCellChromeBase,
  {
    border: `1px solid ${tokens.green500}`,
    transition: 'border-color 120ms ease, border-width 120ms ease',
  },
]);

export const tableCellChromeMappedHovered = css([
  tableCellChromeBase,
  {
    border: `2px solid ${tokens.green600}`,
    transition: 'border-color 120ms ease, border-width 120ms ease',
  },
]);

export const tableCellChromeUnmapped = css([
  tableCellChromeBase,
  {
    border: `1px solid ${tokens.gray300}`,
  },
]);
