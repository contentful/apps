import { Box } from '@contentful/f36-components';
import { cx } from 'emotion';
import { ReactNode } from 'react';
import { styles } from './PreviewBox.styles';

interface PreviewBoxProps {
  children: ReactNode;
  className?: string;
}

const PreviewBox = ({ children, className }: PreviewBoxProps) => {
  return <Box className={cx(styles.container, className)}>{children}</Box>;
};

export default PreviewBox;
