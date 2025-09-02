import tokens from '@contentful/f36-tokens';

export const styles = {
  editProgress: {
    background: tokens.gray100,
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingM,
  },
} as const;
