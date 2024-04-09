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
  vercelAccessTokenStatus: boolean | null;
  selectedProject: string;
  contentTypePreviewPathSelections: ContentTypePreviewPathSelection[];
  selectedApiPath: string;
}

export interface Project {
  id: string;
  name: string;
  targets: {
    production: {
      id: string;
    };
  };
}

// TO DO: Add missing properties based on API implementation
export interface Path {
  id: string;
  name: string;
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

export interface ListProjectsResponse {
  projects: Project[];
}

export interface CreateDeploymentInput {
  project: Project;
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
