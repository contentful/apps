import React from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Box, Heading, Text } from '@contentful/f36-components';

const Page = () => {
  const sdk = useSDK();

  return (
    <Box padding="spacingL">
      <Heading>Bulk Edit App</Heading>
      <Text>Welcome to the Bulk Edit application.</Text>
    </Box>
  );
};

export default Page;
