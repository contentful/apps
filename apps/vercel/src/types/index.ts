export interface Project {
  id: string;
  name: string;
}

export interface AppInstallationParameters {
  vercelAccessToken: string;
  vercelAccessTokenStatus: boolean;
  projects: Project[];
  selectedProject: string;
}
