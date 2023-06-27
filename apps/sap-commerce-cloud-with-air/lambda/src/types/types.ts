export interface AppConfiguration {
  privateKey: string;
  signingSecret: string;
}

export interface AppInstallationParameters {
  [key: string]: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Hash = Record<string, any>;
