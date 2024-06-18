export type ContentTypePreviewPathSelection = {
  contentType: string;
  previewPath: string;
};

export type ApplyContentTypePreviewPathSelectionPayload = {
  newPreviewPath: string;
  oldContentType: string;
  newContentType: string;
};

export interface AppInstallationParameters {
  vercelAccessToken: string;
  selectedProject: string;
  contentTypePreviewPathSelections: ContentTypePreviewPathSelection[];
  selectedApiPath: string;
  teamId?: string;
}

export type ProjectEnv = {
  key: string;
  id: string;
  value: string;
};
export interface Project {
  id: string;
  name: string;
  targets: {
    production: {
      id: string;
    };
  };
  env: ProjectEnv[];
  protectionBypass?: {
    [key: string]: {
      createdAt: number;
      createdBy: string;
      scope: string;
    };
  };
}

export interface Deployment {
  name: string;
  status: string;
  target: string;
  projectId: string;
  bootedAt: Date;
  createdAt: Date;
  uid: string;
}

// TO DO: Add missing properties based on API implementation
export interface Path {
  id: string;
  name: string;
}

export interface ListProjectsResponse {
  projects: Project[];
}

export type ServerlessFunction = {
  path: string;
  regions: string[];
  runtime: string;
  size: number;
  type: string;
};

export interface ListDeploymentSummaryResponse {
  serverlessFunctions: ServerlessFunction[];
}

export type ApiPath = {
  id: string;
  name: string;
};

export type AccessToken = {
  id: string;
  teamId?: string;
  name: string;
  expiresAt: string;
};

export type PreviewPathError = {
  contentType: string;
  invalidPreviewPathFormat: boolean;
  emptyPreviewPathInput: boolean;
};

export type Errors = {
  authentication: {
    invalidToken: boolean;
    expiredToken: boolean;
    invalidTeamScope: boolean;
  };
  projectSelection: {
    projectNotFound: boolean;
    protectionBypassIsDisabled: boolean;
    cannotFetchProjects: boolean;
    invalidSpaceId: boolean;
  };
  apiPathSelection: {
    apiPathNotFound: boolean;
    apiPathsEmpty: boolean;
    cannotFetchApiPaths: boolean;
    invalidDeploymentData: boolean;
  };
  previewPathSelection: PreviewPathError[];
};
