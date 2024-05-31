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
  contentfulPreviewSecret: string;
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

export type VercelEnvironmentVariable = {
  /**
   * Unique identifier for the configuration
   */
  configurationId: string | null;

  /**
   * Timestamp when the configuration was created (in milliseconds since epoch)
   */
  createdAt: number;

  /**
   * Identifier of the user who created the configuration
   */
  createdBy: string;

  /**
   * Indicates whether the configuration is decrypted
   */
  decrypted: boolean;

  /**
   * Unique identifier for the configuration entry
   */
  id: string;

  /**
   * The key associated with the configuration
   */
  key: string;

  /**
   * Display name of the last user who edited the configuration
   */
  lastEditedByDisplayName: string;

  /**
   * An array of target environments for the configuration
   */
  target: Array<'production' | 'development' | 'preview'>;

  /**
   * Type of the configuration (in this case, 'encrypted')
   */
  type: 'encrypted' | 'sensitive' | 'plain' | 'secret';

  /**
   * Timestamp when the configuration was last updated (in milliseconds since epoch)
   */
  updatedAt: number;

  /**
   * Identifier of the user who last updated the configuration
   */
  updatedBy: string | null;

  /**
   * The encrypted value of the configuration
   */
  value: string;
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
  contentfulPreviewSecret: {
    invalidContentfulPreviewSecret: boolean;
    cannotFetchVercelEnvVars: boolean;
    environmentVariableAlreadyExists: boolean;
  };
  projectSelection: {
    projectNotFound: boolean;
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
