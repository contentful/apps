import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const depthIndent = (depth: number) =>
  css({
    marginLeft: depth > 1 ? `${(depth - 1) * 24}px` : undefined,
  });

export const styles = {
  accordionContainer: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    borderRight: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusSmall,
  }),
  accordionHeader: css({
    width: '100%',
  }),
  noteWarning: css({
    padding: tokens.spacingM,
    backgroundColor: tokens.yellow100,
    borderRadius: tokens.borderRadiusSmall,
    marginTop: tokens.spacingS,
  }),
  noteNeutral: css({
    padding: tokens.spacingM,
    borderRadius: tokens.borderRadiusSmall,
    marginTop: tokens.spacingS,
  }),
  fieldBox: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusSmall,
  }),
};
