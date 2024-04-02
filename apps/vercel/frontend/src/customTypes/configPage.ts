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

export interface Deployment {
  id: string;
  name: string;
  status: string;
  target: string;
  projectId: string;
  bootedAt: Date;
  createdAt: Date;
}

export interface ListProjectsResponse {
  projects: Project[];
}

export interface CreateDeploymentInput {
  project: Project;
}
