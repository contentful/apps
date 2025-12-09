import { useState } from 'react';
import type {
  ContentLifecyclePermissions,
  OtherFeaturesPermissions,
  MigrationPermissions,
  EntityPermissions,
} from '../components/types/config';
import {
  createEmptyEntityPermissions,
  createAllPermissions,
} from '../utils/permissions';

export const usePermissions = () => {
  const [contentLifecyclePermissions, setContentLifecyclePermissions] =
    useState<ContentLifecyclePermissions>({
      selectAll: false,
      entries: createEmptyEntityPermissions(),
      assets: createEmptyEntityPermissions(),
      contentTypes: createEmptyEntityPermissions(),
    });

  const [otherFeaturesPermissions, setOtherFeaturesPermissions] =
    useState<OtherFeaturesPermissions>({
      runAIActions: false,
      triggerAutomations: false,
      installApps: false,
      callAppActions: false,
      invokeAgents: false,
    });

  const [migrationPermissions, setMigrationPermissions] =
    useState<MigrationPermissions>({
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
    });
  };

  const handleEntityActionToggle = (
    entity: 'entries' | 'assets' | 'contentTypes',
    action: string,
  ) => {
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
    const currentValue =
      contentLifecyclePermissions.entries[action as keyof EntityPermissions];
    const newValue = !currentValue;
    setContentLifecyclePermissions((prev) => ({
      ...prev,
      entries: { ...prev.entries, [action]: newValue },
      assets: { ...prev.assets, [action]: newValue },
      contentTypes: { ...prev.contentTypes, [action]: newValue },
      selectAll: false,
    }));
  };

  const handleRowToggle = (entity: 'entries' | 'assets' | 'contentTypes') => {
    const allChecked = Object.values(contentLifecyclePermissions[entity]).every(
      (v) => v,
    );
    const newValue = !allChecked;
    const allPermissions = createAllPermissions(newValue);
    setContentLifecyclePermissions((prev) => ({
      ...prev,
      [entity]: allPermissions,
      selectAll: false,
    }));
  };

  const handleOtherFeatureToggle = (
    permission: keyof OtherFeaturesPermissions,
  ) => {
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
    handleSelectAllToggle,
    handleEntityActionToggle,
    handleColumnToggle,
    handleRowToggle,
    handleOtherFeatureToggle,
    handleMigrationToggle,
  };
};
