import { type FC } from 'react';
import { Stack, Heading, Text, Badge, Flex } from '@contentful/f36-components';

export const SetupHeader: FC = () => (
  <Stack flexDirection="column" spacing="spacingXs" alignItems="flex-start">
    <Heading as="h2" fontSize="fontSizeL" marginBottom="none">
      Set up instructions
    </Heading>

    <Flex gap="spacing2Xs" alignItems="flex-start" flexWrap="wrap">
      <Text fontSize="fontSizeM" marginBottom="none">
        Contentful hosts an MCP server that&apos;s available at
      </Text>
      <Badge variant="secondary" textTransform="none">
        {' '}
        https://mcp.contentful.com
      </Badge>
      <Text fontSize="fontSizeM" marginBottom="none">
        Here are instructions for specific tools.
      </Text>
    </Flex>
  </Stack>
);
