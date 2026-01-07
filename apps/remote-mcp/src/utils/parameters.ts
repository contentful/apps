import type { InstallParameters, AppInstallationParameters } from '../components/types/config';

export const createAppInstallationParameters = (
  parameters: InstallParameters
): AppInstallationParameters => {
  return {
    selectAll: parameters.contentLifecyclePermissions.selectAll,
    entries: JSON.stringify(parameters.contentLifecyclePermissions.entries),
    assets: JSON.stringify(parameters.contentLifecyclePermissions.assets),
    contentTypes: JSON.stringify(parameters.contentLifecyclePermissions.contentTypes),
    runAIActions: parameters.otherFeaturesPermissions.runAIActions,
    triggerAutomations: parameters.otherFeaturesPermissions.triggerAutomations,
    installApps: parameters.otherFeaturesPermissions.installApps,
    callAppActions: parameters.otherFeaturesPermissions.callAppActions,
    invokeAgents: parameters.otherFeaturesPermissions.invokeAgents,
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
    },
    migrationPermissions: {
      migrateWithinSpace: parameters.migrateWithinSpace,
      migrateBetweenSpaces: parameters.migrateBetweenSpaces,
    },
    otherFeaturesPermissions: {
      runAIActions: parameters.runAIActions,
      triggerAutomations: parameters.triggerAutomations,
      installApps: parameters.installApps,
      callAppActions: parameters.callAppActions,
      invokeAgents: parameters.invokeAgents,
    },
  };
};
