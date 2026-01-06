import { useState } from 'react';
import type {
  ContentLifecyclePermissions,
  OtherFeaturesPermissions,
  MigrationPermissions,
  EntityPermissions,
  ContentLifecycleEntityKey,
} from '../components/types/config';
import { createEmptyEntityPermissions, createAllPermissions } from '../utils/permissions';

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
    const allPermissions = createAllPermissions(newValue);
    setContentLifecyclePermissions({
      selectAll: newValue,
      entries: allPermissions,
      assets: allPermissions,
      contentTypes: allPermissions,
      aiActions: allPermissions,
      editorInterfaces: allPermissions,
      environments: allPermissions,
      locales: allPermissions,
      orgs: allPermissions,
      spaces: allPermissions,
      tags: allPermissions,
      concepts: allPermissions,
      conceptSchemes: allPermissions,
    });
  };

  const handleEntityActionToggle = (entity: ContentLifecycleEntityKey, action: string) => {
    setContentLifecyclePermissions((prev) => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        [action]: !prev[entity][action as keyof EntityPermissions],
      },
      selectAll: false,
    }));
  };

  const handleColumnToggle = (action: string) => {
    const currentValue = contentLifecyclePermissions.entries[action as keyof EntityPermissions];
    const newValue = !currentValue;
    setContentLifecyclePermissions((prev) => ({
      ...prev,
      entries: { ...prev.entries, [action]: newValue },
      assets: { ...prev.assets, [action]: newValue },
      contentTypes: { ...prev.contentTypes, [action]: newValue },
      aiActions: { ...prev.aiActions, [action]: newValue },
      editorInterfaces: { ...prev.editorInterfaces, [action]: newValue },
      environments: { ...prev.environments, [action]: newValue },
      locales: { ...prev.locales, [action]: newValue },
      orgs: { ...prev.orgs, [action]: newValue },
      spaces: { ...prev.spaces, [action]: newValue },
      tags: { ...prev.tags, [action]: newValue },
      concepts: { ...prev.concepts, [action]: newValue },
      conceptSchemes: { ...prev.conceptSchemes, [action]: newValue },
      selectAll: false,
    }));
  };

  const handleRowToggle = (entity: ContentLifecycleEntityKey) => {
    const allChecked = Object.values(contentLifecyclePermissions[entity]).every((v) => v);
    const newValue = !allChecked;
    const allPermissions = createAllPermissions(newValue);
    setContentLifecyclePermissions((prev) => ({
      ...prev,
      [entity]: allPermissions,
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
