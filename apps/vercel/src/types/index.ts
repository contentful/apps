import { ContentType } from '@contentful/app-sdk';

export interface Project {
  id: string;
  name: string;
}

export interface AppInstallationParameters {
  vercelAccessToken: string;
  vercelAccessTokenStatus: boolean | null;
  projects: Project[];
  selectedProject: string;
  contentTypes: ContentType[];
  selectedContentType: string;
}
