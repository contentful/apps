import { type FC } from 'react';
import { Stack, Heading, Text, Accordion } from '@contentful/f36-components';
import { ContentLifecyclePermissionsTable } from './ContentLifecyclePermissionsTable';
import { OtherFeaturesPermissions } from './OtherFeaturesPermissions';
import type {
  ContentLifecyclePermissions,
  OtherFeaturesPermissions as OtherFeaturesPermissionsType,
  OtherFeaturesPermissionKey,
  ContentLifecycleEntityKey,
  EntityActionKey,
} from '../types/config';

interface PermissionsSectionProps {
  contentLifecyclePermissions: ContentLifecyclePermissions;
  otherFeaturesPermissions: OtherFeaturesPermissionsType;
  expandedAccordions: {
    contentLifecycle: boolean;
    otherFeatures: boolean;
  };
  onAccordionToggle: (section: string, expanded: boolean) => void;
  onSelectAllToggle: () => void;
  onEntityActionToggle: (entity: ContentLifecycleEntityKey, action: EntityActionKey) => void;
  onColumnToggle: (action: EntityActionKey) => void;
  onRowToggle: (entity: ContentLifecycleEntityKey) => void;
  onOtherFeatureToggle: (permission: OtherFeaturesPermissionKey) => void;
}

export const PermissionsSection: FC<PermissionsSectionProps> = ({
  contentLifecyclePermissions,
  otherFeaturesPermissions,
  expandedAccordions,
  onAccordionToggle,
  onSelectAllToggle,
  onEntityActionToggle,
  onColumnToggle,
  onRowToggle,
  onOtherFeatureToggle,
}) => (
  <Stack
    flexDirection="column"
    spacing="spacing2Xs"
    alignItems="flex-start"
    style={{ width: '100%' }}>
    <Heading as="h2" marginBottom="spacing2Xs" style={{ fontSize: '16px' }}>
      Configure Contentful access
    </Heading>
    <Text marginBottom="spacingM">
      Allow the MCP server to access entities and features within your Contentful space.
    </Text>

    <Accordion style={{ width: '100%', maxWidth: '100%' }}>
      <Accordion.Item
        title={<span style={{ fontSize: '14px' }}>Content lifecycle actions</span>}
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
        title={<span style={{ fontSize: '14px' }}>Actions on other features</span>}
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
    </Accordion>
  </Stack>
);
