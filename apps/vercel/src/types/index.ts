interface Project {
  id: string;
  name: string;
}

export interface AppInstallationParameters {
  vercelAccessToken: string;
  projects: Project[];
}
