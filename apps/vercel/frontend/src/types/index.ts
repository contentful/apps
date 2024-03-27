import { ContentType } from '@contentful/app-sdk';

export type ContentTypePreviewPathSelection = {
  contentType: string;
  previewPath: string;
};
export interface AppInstallationParameters {
  vercelAccessToken: string;
  vercelAccessTokenStatus: boolean | null;
  projects: Project[];
  selectedProject: string;
  contentTypePreviewPathSelections: ContentTypePreviewPathSelection[];
  contentTypes: ContentType[];
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
