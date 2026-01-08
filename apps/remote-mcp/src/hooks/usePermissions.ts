import { useState } from 'react';
import type {
  ContentLifecyclePermissions,
  OtherFeaturesPermissions,
  MigrationPermissions,
  EntityPermissions,
  ContentLifecycleEntityKey,
  EntityActionKey,
} from '../components/types/config';
import { ALL_ENTITIES } from '../components/types/config';
import {
  createEmptyEntityPermissions,
  createEntityPermissions,
  areAllAvailablePermissionsChecked,
  isActionAvailable,
} from '../utils/permissions';

export const usePermissions = () => {
  const [contentLifecyclePermissions, setContentLifecyclePermissions] =
    useState<ContentLifecyclePermissions>({
      selectAll: false,
      entries: createEmptyEntityPermissions(),
      assets: createEmptyEntityPermissions(),
      contentTypes: createEmptyEntityPermissions(),
      aiActions: createEmptyEntityPermissions(),
      editorInterfaces: createEmptyEntityPermissions(),
      environments: createEmptyEntityPermissions(),
      locales: createEmptyEntityPermissions(),
      orgs: createEmptyEntityPermissions(),
      spaces: createEmptyEntityPermissions(),
      tags: createEmptyEntityPermissions(),
      concepts: createEmptyEntityPermissions(),
      conceptSchemes: createEmptyEntityPermissions(),
    });

  const [otherFeaturesPermissions, setOtherFeaturesPermissions] =
    useState<OtherFeaturesPermissions>({
      runAIActions: false,
    });

  const [migrationPermissions, setMigrationPermissions] = useState<MigrationPermissions>({
    migrateWithinSpace: false,
    migrateBetweenSpaces: false,
  });

  const handleSelectAllToggle = () => {
    const newValue = !contentLifecyclePermissions.selectAll;
    setContentLifecyclePermissions({
      selectAll: newValue,
      entries: createEntityPermissions('entries', newValue),
      assets: createEntityPermissions('assets', newValue),
      contentTypes: createEntityPermissions('contentTypes', newValue),
      aiActions: createEntityPermissions('aiActions', newValue),
      editorInterfaces: createEntityPermissions('editorInterfaces', newValue),
      environments: createEntityPermissions('environments', newValue),
      locales: createEntityPermissions('locales', newValue),
      orgs: createEntityPermissions('orgs', newValue),
      spaces: createEntityPermissions('spaces', newValue),
      tags: createEntityPermissions('tags', newValue),
      concepts: createEntityPermissions('concepts', newValue),
      conceptSchemes: createEntityPermissions('conceptSchemes', newValue),
    });
  };

  const handleEntityActionToggle = (entity: ContentLifecycleEntityKey, action: EntityActionKey) => {
    setContentLifecyclePermissions((prev) => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        [action]: !prev[entity][action as keyof EntityPermissions],
      },
      selectAll: false,
    }));
  };

  const handleColumnToggle = (action: EntityActionKey) => {
    // Find all entities that support this action
    const entitiesWithAction = ALL_ENTITIES.filter((entity) => isActionAvailable(entity, action));

    // Check if all entities that support this action currently have it enabled
    const allChecked = entitiesWithAction.every(
      (entity) => contentLifecyclePermissions[entity][action]
    );
    const newValue = !allChecked;

    setContentLifecyclePermissions((prev) => {
      const updates: Partial<ContentLifecyclePermissions> = {};
      for (const entity of ALL_ENTITIES) {
        // Only update entities that support this action
        if (isActionAvailable(entity, action)) {
          updates[entity] = { ...prev[entity], [action]: newValue };
        }
      }
      return {
        ...prev,
        ...updates,
        selectAll: false,
      };
    });
  };

  const handleRowToggle = (entity: ContentLifecycleEntityKey) => {
    // Check if all available actions for this entity are currently enabled
    const allChecked = areAllAvailablePermissionsChecked(
      entity,
      contentLifecyclePermissions[entity]
    );
    const newValue = !allChecked;
    // Only set available actions for this entity
    const entityPermissions = createEntityPermissions(entity, newValue);
    setContentLifecyclePermissions((prev) => ({
      ...prev,
      [entity]: entityPermissions,
      selectAll: false,
    }));
  };

  const handleOtherFeatureToggle = (permission: keyof OtherFeaturesPermissions) => {
    setOtherFeaturesPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  const handleMigrationToggle = (permission: keyof MigrationPermissions) => {
    setMigrationPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  return {
    contentLifecyclePermissions,
    otherFeaturesPermissions,
    migrationPermissions,
    setContentLifecyclePermissions,
    setOtherFeaturesPermissions,
    setMigrationPermissions,
    handleSelectAllToggle,
    handleEntityActionToggle,
    handleColumnToggle,
    handleRowToggle,
    handleOtherFeatureToggle,
    handleMigrationToggle,
  };
};
