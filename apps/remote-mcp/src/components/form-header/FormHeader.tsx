import { type FC } from 'react';
import { Stack, Heading, Paragraph, Note } from '@contentful/f36-components';

export const FormHeader: FC = () => (
  <Stack flexDirection="column" spacing="spacingS" alignItems="flex-start">
    <Heading as="h1" fontSize="fontSizeXl" marginBottom="none">
      Set up the Contentful remote MCP Server (Beta)
    </Heading>

    <Paragraph fontSize="fontSizeM" marginBottom="none">
      Contentful&apos;s Remote MCP server lets you connect external LLM tools (such as Cursor,
      Claude code, or VS code) to your spaces. Once connected, you can use your preferred tool to
      perform actions in Contentful, like editing entries, updating content models, or migrating
      content between spaces.
    </Paragraph>

    <Note variant="warning" title="Beta release">
      This feature is in early access and may change as development continues. After you install
      this app, open your preferred LLM tool to finish setup and install Contentful&apos;s MCP
      there. Please note, the MCP app does not create a conversational interface inside Contentful,
      it only enables integrations from external tools.
    </Note>
  </Stack>
);
