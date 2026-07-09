import { type FC } from 'react';
import { Stack, Heading, Text, Accordion, Note } from '@contentful/f36-components';
import { ContentLifecyclePermissionsTable } from './ContentLifecyclePermissionsTable';
import { OtherFeaturesPermissions } from './OtherFeaturesPermissions';
import { CLASSIC_ENTITIES, EXO_ENTITIES } from '../types/config';
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
    experienceOrchestration: boolean;
    otherFeatures: boolean;
  };
  onAccordionToggle: (section: string, expanded: boolean) => void;
  onSelectAllToggle: (entities: ContentLifecycleEntityKey[]) => void;
  onEntityActionToggle: (entity: ContentLifecycleEntityKey, action: EntityActionKey) => void;
  onColumnToggle: (entities: ContentLifecycleEntityKey[], action: EntityActionKey) => void;
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
            visibleEntities={CLASSIC_ENTITIES}
            onSelectAllToggle={onSelectAllToggle}
            onEntityActionToggle={onEntityActionToggle}
            onColumnToggle={onColumnToggle}
            onRowToggle={onRowToggle}
          />
        </div>
      </Accordion.Item>

      <Accordion.Item
        title="Experience orchestration actions"
        isExpanded={expandedAccordions.experienceOrchestration}
        onExpand={() => onAccordionToggle('experienceOrchestration', true)}
        onCollapse={() => onAccordionToggle('experienceOrchestration', false)}>
        <div
          style={{
            marginTop: '-12px',
            boxSizing: 'border-box',
            paddingRight: '16px',
          }}>
          <Note variant="neutral" style={{ marginBottom: '16px' }}>
            These tools are only available in Experience Orchestration (ExO) compatible spaces. If
            your space is not ExO compatible, enabling these permissions has no effect and the
            corresponding tools will not be available.
          </Note>
          <ContentLifecyclePermissionsTable
            permissions={contentLifecyclePermissions}
            visibleEntities={EXO_ENTITIES}
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
    </Accordion>
  </Stack>
);
