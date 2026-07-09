import type { InstallParameters, AppInstallationParameters } from '../components/types/config';
import { createEmptyEntityPermissions } from './permissions';

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
    componentTypes: JSON.stringify(parameters.contentLifecyclePermissions.componentTypes),
    experiences: JSON.stringify(parameters.contentLifecyclePermissions.experiences),
    templates: JSON.stringify(parameters.contentLifecyclePermissions.templates),
    dataAssemblies: JSON.stringify(parameters.contentLifecyclePermissions.dataAssemblies),
    fragments: JSON.stringify(parameters.contentLifecyclePermissions.fragments),
    runAIActions: parameters.otherFeaturesPermissions.runAIActions,
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
      componentTypes: parameters.componentTypes
        ? JSON.parse(parameters.componentTypes)
        : createEmptyEntityPermissions(),
      experiences: parameters.experiences
        ? JSON.parse(parameters.experiences)
        : createEmptyEntityPermissions(),
      templates: parameters.templates
        ? JSON.parse(parameters.templates)
        : createEmptyEntityPermissions(),
      dataAssemblies: parameters.dataAssemblies
        ? JSON.parse(parameters.dataAssemblies)
        : createEmptyEntityPermissions(),
      fragments: parameters.fragments
        ? JSON.parse(parameters.fragments)
        : createEmptyEntityPermissions(),
    },
    otherFeaturesPermissions: {
      runAIActions: parameters.runAIActions,
    },
  };
};
