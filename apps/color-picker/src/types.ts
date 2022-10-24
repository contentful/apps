export interface Color {
  id: string;
  name: string;
  value: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: Color[];
}

export interface AppInstallationParameters {
  themes: Theme[];
}
