export type FormObject = {
  id: string;
  url: string;
  name: string;
};

export type MarketoFormsResponse = {
  forms?: FormObject[];
};

export enum ConnectionStatus {
  None = 'none',
  Testing = 'testing',
  Success = 'success',
  Error = 'error',
}

export interface AppInstallationParameters {
  clientId: string;
  clientSecret: string;
  munchkinId: string;
  connectionStatus?: ConnectionStatus;
  connectionMessage?: string;
}
