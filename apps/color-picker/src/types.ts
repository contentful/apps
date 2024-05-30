export interface Color {
  id: string;
  name: string;
  value: string;
  theme: Theme['name'];
}

export interface Theme {
  id: string;
  name: string;
  colors: Color[];
}

export interface AppInstallationParameters {
  themes: Theme[];
}
