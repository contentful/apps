import { FC, ReactNode } from 'react';
import { Box, Note } from '@contentful/f36-components';

/** What a Robots table renders instead of an empty body. */
const EmptyTableNote: FC<{ children: ReactNode }> = ({ children }) => (
  <Box marginTop="spacingM" marginBottom="spacingM">
    <Note variant="neutral">{children}</Note>
  </Box>
);

export default EmptyTableNote;
