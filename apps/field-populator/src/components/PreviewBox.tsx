import { Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css, cx } from 'emotion';
import { ReactNode } from 'react';

interface PreviewBoxProps {
  children: ReactNode;
  className?: string;
}

const styles = {
  container: css({
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.gray300}`,
    background: tokens.gray100,
    padding: '12px',
    wordBreak: 'break-word',
  }),
};

const PreviewBox = ({ children, className }: PreviewBoxProps) => {
  return <Box className={cx(styles.container, className)}>{children}</Box>;
};

export default PreviewBox;
