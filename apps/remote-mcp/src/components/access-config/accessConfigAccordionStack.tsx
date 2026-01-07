import { type FC } from 'react';
import { Stack, Heading, Text, Accordion } from '@contentful/f36-components';
import { ContentLifecyclePermissionsTable } from './ContentLifecyclePermissionsTable';
import { OtherFeaturesPermissions } from './OtherFeaturesPermissions';
import { MigrationPermissions } from './MigrationPermissions';
import type {
  ContentLifecyclePermissions,
  OtherFeaturesPermissions as OtherFeaturesPermissionsType,
  MigrationPermissions as MigrationPermissionsType,
  OtherFeaturesPermissionKey,
  MigrationPermissionKey,
} from '../types/config';

interface PermissionsSectionProps {
  contentLifecyclePermissions: ContentLifecyclePermissions;
  otherFeaturesPermissions: OtherFeaturesPermissionsType;
  migrationPermissions: MigrationPermissionsType;
  expandedAccordions: {
    contentLifecycle: boolean;
    otherFeatures: boolean;
    migration: boolean;
  };
  onAccordionToggle: (section: string, expanded: boolean) => void;
  onSelectAllToggle: () => void;
  onEntityActionToggle: (entity: 'entries' | 'assets' | 'contentTypes', action: string) => void;
  onColumnToggle: (action: string) => void;
  onRowToggle: (entity: 'entries' | 'assets' | 'contentTypes') => void;
  onOtherFeatureToggle: (permission: OtherFeaturesPermissionKey) => void;
  onMigrationToggle: (permission: MigrationPermissionKey) => void;
}

export const PermissionsSection: FC<PermissionsSectionProps> = ({
  contentLifecyclePermissions,
  otherFeaturesPermissions,
  migrationPermissions,
  expandedAccordions,
  onAccordionToggle,
  onSelectAllToggle,
  onEntityActionToggle,
  onColumnToggle,
  onRowToggle,
  onOtherFeatureToggle,
  onMigrationToggle,
}) => (
  <Stack
    flexDirection="column"
    spacing="spacing2Xs"
    alignItems="flex-start"
    style={{ width: '100%' }}>
    <Heading as="h2" marginBottom="spacing2Xs">
      Configure Contentful access
    </Heading>
    <Text marginBottom="spacingM">
      Allow the MCP server to access entities and features within your Contentful space.
    </Text>

    <Accordion style={{ width: '100%', maxWidth: '100%' }}>
      <Accordion.Item
        title="Content lifecycle actions"
        isExpanded={expandedAccordions.contentLifecycle}
        onExpand={() => onAccordionToggle('contentLifecycle', true)}
        onCollapse={() => onAccordionToggle('contentLifecycle', false)}>
        <div
          style={{
            marginTop: '-12px',
            boxSizing: 'border-box',
            paddingRight: '16px',
          }}>
          <ContentLifecyclePermissionsTable
            permissions={contentLifecyclePermissions}
            onSelectAllToggle={onSelectAllToggle}
            onEntityActionToggle={onEntityActionToggle}
            onColumnToggle={onColumnToggle}
            onRowToggle={onRowToggle}
          />
        </div>
      </Accordion.Item>

      <Accordion.Item
        title="Actions on other features"
        isExpanded={expandedAccordions.otherFeatures}
        onExpand={() => onAccordionToggle('otherFeatures', true)}
        onCollapse={() => onAccordionToggle('otherFeatures', false)}>
        <div
          style={{
            marginTop: '-12px',
            boxSizing: 'border-box',
            paddingRight: '16px',
          }}>
          <OtherFeaturesPermissions
            permissions={otherFeaturesPermissions}
            onPermissionToggle={onOtherFeatureToggle}
          />
        </div>
      </Accordion.Item>

      <Accordion.Item
        title="Migration permissions"
        isExpanded={expandedAccordions.migration}
        onExpand={() => onAccordionToggle('migration', true)}
        onCollapse={() => onAccordionToggle('migration', false)}>
        <div
          style={{
            marginTop: '-12px',
            boxSizing: 'border-box',
            paddingRight: '16px',
          }}>
          <MigrationPermissions
            permissions={migrationPermissions}
            onPermissionToggle={onMigrationToggle}
          />
        </div>
      </Accordion.Item>
    </Accordion>
  </Stack>
);
