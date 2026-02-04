import { type FC } from 'react';
import { Stack } from '@contentful/f36-components';
import { SetupHeader } from './SetupHeader';

export const Setup: FC = () => (
  <Stack flexDirection="column" spacing="spacingXl" alignItems="flex-start">
    <SetupHeader />
  </Stack>
);
