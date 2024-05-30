import { AppInstallationParameters, Errors } from '@customTypes/configPage';

export const initialParameters: AppInstallationParameters = {
  vercelAccessToken: '',
  contentfulPreviewSecret: '',
  selectedProject: '',
  contentTypePreviewPathSelections: [],
  selectedApiPath: '',
  teamId: '',
};

export const initialErrors: Errors = {
  authentication: {
    invalidToken: false,
    invalidTeamScope: false,
    expiredToken: false,
  },
  contentfulPreviewSecret: {
    invalidContentfulPreviewSecret: false,
    environmentVariableAlreadyExists: false,
    cannotFetchVercelEnvVars: false,
  },
  projectSelection: {
    projectNotFound: false,
    cannotFetchProjects: false,
    invalidSpaceId: false,
  },
  apiPathSelection: {
    apiPathNotFound: false,
    apiPathsEmpty: false,
    cannotFetchApiPaths: false,
    invalidDeploymentData: false,
  },
  previewPathSelection: [],
};
