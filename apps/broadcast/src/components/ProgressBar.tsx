import { Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

type ProgressVariant = 'positive' | 'warning' | 'negative';

type ProgressBarProps = {
  value: number;
  variant?: ProgressVariant;
};

const styles = {
  track: css({
    backgroundColor: tokens.colorElementLight,
    borderRadius: tokens.borderRadiusSmall,
    height: '8px',
    overflow: 'hidden',
    width: '100%',
  }),
  bar: (variant: ProgressVariant, value: number) =>
    css({
      backgroundColor:
        variant === 'negative'
          ? tokens.colorNegative
          : variant === 'warning'
          ? tokens.colorWarning
          : tokens.colorPositive,
      height: '100%',
      transition: 'width 150ms ease-out',
      width: `${value}%`,
    }),
};

const clampValue = (value: number) => Math.max(0, Math.min(100, value));

const ProgressBar = ({ value, variant = 'positive' }: ProgressBarProps) => {
  const clamped = clampValue(value);

  return (
    <Box className={styles.track} role="progressbar" aria-valuenow={clamped}>
      <Box className={styles.bar(variant, clamped)} />
    </Box>
  );
};

export default ProgressBar;
