import { type FC } from 'react';
import { Stack, Text, Checkbox, Table, Flex, Box } from '@contentful/f36-components';
import type { ContentLifecyclePermissions } from '../types/config';
import type { ContentLifecycleEntityKey, EntityActionKey } from '../types/config';

interface ContentLifecyclePermissionsTableProps {
  permissions: ContentLifecyclePermissions;
  onSelectAllToggle: () => void;
  onEntityActionToggle: (entity: ContentLifecycleEntityKey, action: EntityActionKey) => void;
  onColumnToggle: (action: EntityActionKey) => void;
  onRowToggle: (entity: ContentLifecycleEntityKey) => void;
}

export const ContentLifecyclePermissionsTable: FC<ContentLifecyclePermissionsTableProps> = ({
  permissions,
  onSelectAllToggle,
  onEntityActionToggle,
  onColumnToggle,
  onRowToggle,
}) => (
  <Stack flexDirection="column" spacing="spacing2Xs" alignItems="flex-start">
    <Text>
      Allow the MCP server to read, edit, create, delete, publish, un-publish, archive or unarchive
      entities within Contentful.
    </Text>
    <Box marginTop="spacingS">
      <Checkbox isChecked={permissions.selectAll} onChange={onSelectAllToggle}>
        Select all entities and actions in the table below
      </Checkbox>
    </Box>

    <div style={{ width: '100%', overflowX: 'auto' }}>
      <Table style={{ minWidth: '800px' }}>
        <Table.Head>
          <Table.Row>
            <Table.Cell></Table.Cell>
            {[
              'read',
              'edit',
              'create',
              'delete',
              'publish',
              'unpublish',
              'archive',
              'unarchive',
            ].map((action) => (
              <Table.Cell key={action} style={{ textAlign: 'center', verticalAlign: 'bottom' }}>
                <Flex flexDirection="column" alignItems="center" gap="spacingXs">
                  <Text fontWeight="fontWeightMedium" fontSize="fontSizeS">
                    {action.charAt(0).toUpperCase() +
                      action
                        .slice(1)
                        .replace('unpublish', 'Un-publish')
                        .replace('unarchive', 'Un-archive')}
                  </Text>
                  <Checkbox
                    isChecked={
                      permissions.entries[action as keyof typeof permissions.entries] &&
                      permissions.assets[action as keyof typeof permissions.assets] &&
                      permissions.contentTypes[action as keyof typeof permissions.contentTypes]
                    }
                    onChange={() => onColumnToggle(action as EntityActionKey)}
                  />
                </Flex>
              </Table.Cell>
            ))}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {(['entries', 'assets', 'contentTypes'] as const).map((entity) => (
            <Table.Row key={entity}>
              <Table.Cell>
                <Checkbox
                  isChecked={Object.values(permissions[entity]).every((v) => v)}
                  onChange={() => onRowToggle(entity)}>
                  {entity === 'contentTypes'
                    ? 'Content types'
                    : entity.charAt(0).toUpperCase() + entity.slice(1)}
                </Checkbox>
              </Table.Cell>
              {[
                'read',
                'edit',
                'create',
                'delete',
                'publish',
                'unpublish',
                'archive',
                'unarchive',
              ].map((action) => (
                <Table.Cell key={action}>
                  <Flex justifyContent="center">
                    <Checkbox
                      isChecked={permissions[entity][action as keyof typeof permissions.entries]}
                      onChange={() => onEntityActionToggle(entity, action as EntityActionKey)}
                    />
                  </Flex>
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  </Stack>
);
