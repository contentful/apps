export type FormObject = {
  id: string;
  url: string;
  name: string;
};

export type MarketoFormsResponse = {
  forms?: FormObject[];
  // Offset of the next forms.json page; absent when this was the last page.
  nextOffset?: number;
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
