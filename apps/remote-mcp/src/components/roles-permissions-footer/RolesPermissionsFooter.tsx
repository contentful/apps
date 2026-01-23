import { type FC } from 'react';
import { Stack, Heading, Text } from '@contentful/f36-components';

export const RolesPermissionsFooter: FC = () => (
  <Stack
    flexDirection="column"
    spacing="spacingXs"
    alignItems="flex-start"
    paddingTop="spacingM"
    paddingBottom="spacingM">
    <Heading as="h2" fontSize="fontSizeL" marginBottom="none">
      Roles and permissions
    </Heading>

    <Text fontSize="fontSizeM" marginBottom="none">
      The MCP server can only perform actions that the user&apos;s role in Contentful allows. If a
      user doesn&apos;t have permission to edit or delete content, they won&apos;t be able to
      perform those actions via MCP. The server always respects existing role-based permissions in
      your organization. For example, if a user in your space does not have permission to edit
      content, they cannot do so via MCP.
    </Text>
  </Stack>
);
