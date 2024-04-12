import { Box } from '@contentful/f36-components';

import { styles } from './SectionWrapper.styles';

interface Props {
  children: React.ReactNode;
  testId?: string;
}

export const SectionWrapper = ({ children, testId }: Props) => {
  return (
    <Box data-testid={testId} marginBottom="spacingM" className={styles.box}>
      {children}
    </Box>
  );
};
