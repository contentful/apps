import { FC } from 'react';
import { Box, Note } from '@contentful/f36-components';
import { ROBOTS_ADMINS_ONLY_NOTE } from '../../util/robotsAccess';

/** What someone who cannot run Robots sees in place of the run controls. See `canRunRobots`. */
const RobotsAdminsOnlyNote: FC = () => (
  <Box marginBottom="spacingM">
    <Note variant="neutral" data-testid="robots-admins-only">
      {ROBOTS_ADMINS_ONLY_NOTE}
    </Note>
  </Box>
);

export default RobotsAdminsOnlyNote;
