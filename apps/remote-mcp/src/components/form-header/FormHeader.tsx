import { type FC } from 'react';
import { Stack, Heading } from '@contentful/f36-components';
import { LogoGroup } from './LogoGroup';

export const ConfigHeader: FC = () => (
  <Stack
    flexDirection="column"
    alignItems="center"
    spacing="spacingM"
    style={{ width: '100%' }}
  >
    <LogoGroup />

    <Heading as="h1" style={{ textAlign: 'center', marginBottom: '8px' }}>
      Install Contentful's Remote MCP (Alpha) app for your environment and 
      set your permissions
    </Heading>
  </Stack>
);
