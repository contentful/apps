import { useState } from 'react';
import type {
  ContentLifecyclePermissions,
  OtherFeaturesPermissions,
  EntityPermissions,
  ContentLifecycleEntityKey,
  EntityActionKey,
} from '../components/types/config';
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
      componentTypes: createEmptyEntityPermissions(),
      experiences: createEmptyEntityPermissions(),
      templates: createEmptyEntityPermissions(),
      dataAssemblies: createEmptyEntityPermissions(),
      fragments: createEmptyEntityPermissions(),
    });

  const [otherFeaturesPermissions, setOtherFeaturesPermissions] =
    useState<OtherFeaturesPermissions>({
      runAIActions: false,
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

  const handleSelectAllToggle = (entities: ContentLifecycleEntityKey[]) => {
    // Derive the new value from the section's own entities: if every one is
    // already fully enabled, this toggles the section off; otherwise on.
    const allChecked = entities.every((entity) =>
      areAllAvailablePermissionsChecked(entity, contentLifecyclePermissions[entity])
    );
    const newValue = !allChecked;
    setContentLifecyclePermissions((prev) => {
      const updates: Partial<ContentLifecyclePermissions> = {};
      for (const entity of entities) {
        updates[entity] = createEntityPermissions(entity, newValue);
      }
      return { ...prev, ...updates };
    });
  };

  const handleEntityActionToggle = (entity: ContentLifecycleEntityKey, action: EntityActionKey) => {
    setContentLifecyclePermissions((prev) => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        [action]: !prev[entity][action as keyof EntityPermissions],
      },
    }));
  };

  const handleColumnToggle = (entities: ContentLifecycleEntityKey[], action: EntityActionKey) => {
    // Find all entities in this section that support this action
    const entitiesWithAction = entities.filter((entity) => isActionAvailable(entity, action));

    // Check if all of them currently have it enabled
    const allChecked = entitiesWithAction.every(
      (entity) => contentLifecyclePermissions[entity][action]
    );
    const newValue = !allChecked;

    setContentLifecyclePermissions((prev) => {
      const updates: Partial<ContentLifecyclePermissions> = {};
      for (const entity of entities) {
        // Only update entities that support this action
        if (isActionAvailable(entity, action)) {
          updates[entity] = { ...prev[entity], [action]: newValue };
        }
      }
      return {
        ...prev,
        ...updates,
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
    }));
  };

  const handleOtherFeatureToggle = (permission: keyof OtherFeaturesPermissions) => {
    setOtherFeaturesPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  return {
    contentLifecyclePermissions,
    otherFeaturesPermissions,
    setContentLifecyclePermissions,
    setOtherFeaturesPermissions,
    handleSelectAllToggle,
    handleEntityActionToggle,
    handleColumnToggle,
    handleRowToggle,
    handleOtherFeatureToggle,
  };
};
