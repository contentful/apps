export enum parametersActions {
  UPDATE_VERCEL_ACCESS_TOKEN = 'updateVercelAccessToken',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
  APPLY_SELECTED_PROJECT = 'applySelectedProject',
  ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION = 'addContentTypePreviewPathSelection',
  REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION = 'removeContentTypePreviewPathSelection',
  APPLY_API_PATH = 'applyApiPath',
  APPLY_TEAM_ID = 'applyTeamId',
}

export enum singleSelectionSections {
  PROJECT_SELECTION_SECTION = 'projectSelectionSection',
  API_PATH_SELECTION_SECTION = 'pathSelectionSection',
}

export enum errorsActions {
  UPDATE_AUTHENTICATION_ERRORS = 'updateAuthenticationErrors',
  RESET_AUTHENTICATION_ERRORS = 'restAuthenticationErrors',
  UPDATE_PROJECT_SELECTION_ERRORS = 'updateProjectSelectionErrors',
  RESET_PROJECT_SELECTION_ERRORS = 'resetProjectSelectionErrors',
  UPDATE_API_PATH_SELECTION_ERRORS = 'updateApiPathSelectionErrors',
  RESET_API_PATH_SELECTION_ERRORS = 'resetApiPathSelectionErrors',
  UPDATE_PREVIEW_PATH_ERRORS = 'updatePreviewPathErrors',
  RESET_PREVIEW_PATH_ERRORS = 'resetPreviewPathErrors',
}

export enum errorTypes {
  INVALID_TOKEN = 'invalidToken',
  INVALID_TEAM_SCOPE = 'invalidTeamScope',
  EXPIRED_TOKEN = 'expiredToken',
  PROJECT_NOT_FOUND = 'projectNotFound',
  PROTECTION_BYPASS_IS_DISABLED = 'protectionBypassIsDisabled',
  CANNOT_FETCH_PROJECTS = 'cannotFetchProjects',
  API_PATH_NOT_FOUND = 'apiPathNotFound',
  CANNOT_FETCH_API_PATHS = 'cannotFetchApiPaths',
  INVALID_PREVIEW_PATH_FORMAT = 'invalidPreviewPathFormat',
  EMPTY_PREVIEW_PATH_INPUT = 'emptyPreviewPathInput',
  API_PATHS_EMPTY = 'apiPathsEmpty',
  INVALID_DEPLOYMENT_DATA = 'invalidDeploymentData',
  INVALID_SPACE_ID = 'invalidSpaceId',
}
