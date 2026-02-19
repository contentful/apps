import type { InstallParameters, AppInstallationParameters } from '../components/types/config';

export const createAppInstallationParameters = (
  parameters: InstallParameters
): AppInstallationParameters => {
  return {
    selectAll: parameters.contentLifecyclePermissions.selectAll,
    entries: JSON.stringify(parameters.contentLifecyclePermissions.entries),
    assets: JSON.stringify(parameters.contentLifecyclePermissions.assets),
    contentTypes: JSON.stringify(parameters.contentLifecyclePermissions.contentTypes),
    aiActions: JSON.stringify(parameters.contentLifecyclePermissions.aiActions),
    editorInterfaces: JSON.stringify(parameters.contentLifecyclePermissions.editorInterfaces),
    environments: JSON.stringify(parameters.contentLifecyclePermissions.environments),
    locales: JSON.stringify(parameters.contentLifecyclePermissions.locales),
    orgs: JSON.stringify(parameters.contentLifecyclePermissions.orgs),
    spaces: JSON.stringify(parameters.contentLifecyclePermissions.spaces),
    tags: JSON.stringify(parameters.contentLifecyclePermissions.tags),
    concepts: JSON.stringify(parameters.contentLifecyclePermissions.concepts),
    conceptSchemes: JSON.stringify(parameters.contentLifecyclePermissions.conceptSchemes),
    runAIActions: parameters.otherFeaturesPermissions.runAIActions,
    migrateWithinSpace: parameters.migrationPermissions.migrateWithinSpace,
    migrateBetweenSpaces: parameters.migrationPermissions.migrateBetweenSpaces,
  };
};

export const parseAppInstallationParameters = (
  parameters: AppInstallationParameters
): InstallParameters => {
  return {
    contentLifecyclePermissions: {
      selectAll: parameters.selectAll,
      entries: JSON.parse(parameters.entries),
      assets: JSON.parse(parameters.assets),
      contentTypes: JSON.parse(parameters.contentTypes),
      aiActions: JSON.parse(parameters.aiActions),
      editorInterfaces: JSON.parse(parameters.editorInterfaces),
      environments: JSON.parse(parameters.environments),
      locales: JSON.parse(parameters.locales),
      orgs: JSON.parse(parameters.orgs),
      spaces: JSON.parse(parameters.spaces),
      tags: JSON.parse(parameters.tags),
      concepts: JSON.parse(parameters.concepts),
      conceptSchemes: JSON.parse(parameters.conceptSchemes),
    },
    migrationPermissions: {
      migrateWithinSpace: parameters.migrateWithinSpace,
      migrateBetweenSpaces: parameters.migrateBetweenSpaces,
    },
    otherFeaturesPermissions: {
      runAIActions: parameters.runAIActions,
    },
  };
};
