import { type FC } from 'react';
import { Stack, Text, Checkbox, Table, Flex, Box } from '@contentful/f36-components';
import type { ContentLifecyclePermissions } from '../types/config';
import type { ContentLifecycleEntityKey, EntityActionKey } from '../types/config';
import { ENTITY_AVAILABLE_ACTIONS, STANDARD_ACTIONS, ALL_ENTITIES } from '../types/config';
import { isActionAvailable, areAllAvailablePermissionsChecked } from '../../utils/permissions';

interface ContentLifecyclePermissionsTableProps {
  permissions: ContentLifecyclePermissions;
  visibleEntities?: ContentLifecycleEntityKey[];
  visibleActions?: EntityActionKey[];
  onSelectAllToggle: (entities: ContentLifecycleEntityKey[]) => void;
  onEntityActionToggle: (entity: ContentLifecycleEntityKey, action: EntityActionKey) => void;
  onColumnToggle: (entities: ContentLifecycleEntityKey[], action: EntityActionKey) => void;
  onRowToggle: (entity: ContentLifecycleEntityKey) => void;
}

export const ContentLifecyclePermissionsTable: FC<ContentLifecyclePermissionsTableProps> = ({
  permissions,
  visibleEntities = ALL_ENTITIES,
  visibleActions = STANDARD_ACTIONS,
  onSelectAllToggle,
  onEntityActionToggle,
  onColumnToggle,
  onRowToggle,
}) => {
  // Select-all is derived per-table from this table's own entities, so
  // independent sections (classic vs. ExO) each track their own state.
  const isSelectAllChecked = visibleEntities.every((entity) =>
    areAllAvailablePermissionsChecked(entity, permissions[entity])
  );

  return (
    <Stack flexDirection="column" spacing="spacing2Xs" alignItems="flex-start">
      <Text>
        Allow the MCP server to read, edit, create, delete, publish, un-publish, archive, unarchive,
        or invoke entities within Contentful.
      </Text>
      <Box marginTop="spacingS">
        <Checkbox
          isChecked={isSelectAllChecked}
          onChange={() => onSelectAllToggle(visibleEntities)}>
          Select all entities and actions in the table below
        </Checkbox>
      </Box>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Table style={{ minWidth: '800px' }}>
          <Table.Head>
            <Table.Row>
              <Table.Cell></Table.Cell>
              {visibleActions.map((action) => {
                // Get all VISIBLE entities that support this action
                const entitiesWithAction = visibleEntities.filter((entity) =>
                  isActionAvailable(entity, action)
                );
                // Column is checked if all entities that support this action have it enabled
                const isColumnChecked = entitiesWithAction.every(
                  (entity) => permissions[entity][action as keyof typeof permissions.entries]
                );

                return (
                  <Table.Cell key={action} style={{ textAlign: 'center', verticalAlign: 'bottom' }}>
                    <Flex flexDirection="column" alignItems="center" gap="spacingXs">
                      <Text fontWeight="fontWeightMedium" fontSize="fontSizeS">
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </Text>
                      <Checkbox
                        isChecked={isColumnChecked}
                        onChange={() => onColumnToggle(visibleEntities, action as EntityActionKey)}
                      />
                    </Flex>
                  </Table.Cell>
                );
              })}
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {visibleEntities.map((entity) => {
              const displayNames: Record<ContentLifecycleEntityKey, string> = {
                entries: 'Entries',
                assets: 'Assets',
                contentTypes: 'Content types',
                aiActions: 'AI actions',
                editorInterfaces: 'Editor interfaces',
                environments: 'Environments',
                locales: 'Locales',
                orgs: 'Organizations',
                spaces: 'Spaces',
                tags: 'Tags',
                concepts: 'Concepts',
                conceptSchemes: 'Concept schemes',
                componentTypes: 'Component types',
                experiences: 'Experiences',
                templates: 'Templates',
                dataAssemblies: 'Data assemblies',
                fragments: 'Fragments',
              };

              // Get available actions for this entity
              const availableActions = ENTITY_AVAILABLE_ACTIONS[entity];
              // Row is checked if all available actions for this entity are enabled
              const isRowChecked = availableActions.every(
                (action) => permissions[entity][action as keyof typeof permissions.entries]
              );

              return (
                <Table.Row key={entity}>
                  <Table.Cell>
                    <Checkbox isChecked={isRowChecked} onChange={() => onRowToggle(entity)}>
                      {displayNames[entity]}
                    </Checkbox>
                  </Table.Cell>
                  {visibleActions.map((action) => {
                    const isAvailable = isActionAvailable(entity, action);
                    return (
                      <Table.Cell key={action}>
                        <Flex justifyContent="center">
                          <Checkbox
                            isDisabled={!isAvailable}
                            isChecked={
                              permissions[entity][action as keyof typeof permissions.entries]
                            }
                            onChange={() => onEntityActionToggle(entity, action as EntityActionKey)}
                          />
                        </Flex>
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </div>
    </Stack>
  );
};
