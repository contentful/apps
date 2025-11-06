import React from 'react';
import { Flex, Heading, Paragraph } from '@contentful/f36-components';

export default function TopLevelHeader() {
  return (
    <Flex flexDirection="column" gap="spacingS" fullWidth>
      <Heading as="h1" marginBottom="none">
        Set up my marketplace app
      </Heading>
      <Paragraph marginBottom="none">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </Paragraph>
    </Flex>
  );
}
