import { AppInstallationParameters, Errors } from '@customTypes/configPage';

export const initialParameters: AppInstallationParameters = {
  vercelAccessToken: '',
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
  projectSelection: {
    projectNotFound: false,
    protectionBypassIsDisabled: false,
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
