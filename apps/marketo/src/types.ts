export type FormObject = {
  id: string;
  url: string;
  name: string;
};

export type MarketoFolderRef = { id: number; type: 'Folder' | 'Program' };

export type MarketoFormWithFolder = FormObject & { folder?: MarketoFolderRef };

// rateLimited means Marketo rejected the call for its rate or concurrency
// limit, so the caller should wait and retry the same request.
export type MarketoFormsResponse = {
  forms?: MarketoFormWithFolder[];
  // Offset of the next forms.json page; absent when this was the last page.
  nextOffset?: number;
  rateLimited?: boolean;
};

export type MarketoFolderStatusResponse = {
  folders: Array<MarketoFolderRef & { isArchive: boolean }>;
  rateLimited?: boolean;
};

// Shapes returned by Marketo's Asset API (forms.json / folder/{id}.json).
// Marketo archives at the folder level only -- a form keeps its own
// status (e.g. "approved") regardless of whether its folder is archived.
export type MarketoFormRecord = FormObject & {
  status: string;
  folder?: { type: MarketoFolderRef['type']; value: number; folderName: string };
};

export type MarketoFolderRecord = {
  id: number;
  name: string;
  isArchive: boolean;
};

export type MarketoApiResponse<T> = {
  success: boolean;
  result?: T[];
  message?: string;
  errors?: Array<{ code: string; message: string }>;
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
