import { type FC } from 'react';
import { Stack, Heading, Paragraph } from '@contentful/f36-components';

export const FormHeader: FC = () => (
  <Stack flexDirection="column" spacing="spacingS" alignItems="flex-start">
    <Heading as="h1" fontSize="fontSizeXl" marginBottom="none">
      Set up the Contentful remote MCP Server
    </Heading>

    <Paragraph fontSize="fontSizeM" marginBottom="none">
      Contentful&apos;s Remote MCP server lets you connect external LLM tools (such as Cursor,
      Claude code, or VS code) to your spaces. Once connected, you can use your preferred tool to
      perform actions in Contentful, like editing entries, updating content models, or migrating
      content between spaces.
    </Paragraph>
  </Stack>
);
