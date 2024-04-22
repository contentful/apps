export enum actions {
  UPDATE_VERCEL_ACCESS_TOKEN = 'updateVercelAccessToken',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
  APPLY_SELECTED_PROJECT = 'applySelectedProject',
  ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION = 'addContentTypePreviewPathSelection',
  REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION = 'removeContentTypePreviewPathSelection',
  APPLY_API_PATH = 'applyApiPath',
}

export enum configPageActions {
  UPDATE_CONTENT_TYPES = 'updateContentTypes',
  UPDATE_PROJECTS = 'updateProjects',
  UPDATE_API_PATHS = 'updateApiPaths',
  UPDATE_VERCEL_CLIENT = 'updateVercelClient',
}

export enum singleSelectionSections {
  PROJECT_SELECTION_SECTION = 'projectSelectionSection',
  API_PATH_SELECTION_SECTION = 'pathSelectionSection',
}
