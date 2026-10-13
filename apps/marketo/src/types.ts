export type FormObject = {
  id: string;
  url: string;
  name: string;
};

export type MarketoFormsResponse = {
  forms?: FormObject[];
};

// Shapes returned by Marketo's Asset API (forms.json / folder/{id}.json).
// Marketo archives at the folder level only -- a form keeps its own
// status (e.g. "approved") regardless of whether its folder is archived.
export type MarketoAssetContainerType = 'Folder' | 'Program';

export type MarketoAssetContainerRef = {
  type: MarketoAssetContainerType;
  value: number;
  folderName: string;
};

export type MarketoFormRecord = FormObject & {
  status: string;
  folder?: MarketoAssetContainerRef;
};

// Narrow projection of Adobe's documented Folder schema (name, description,
// createdAt, updatedAt, url, folderId, folderType, parent, path, isArchive,
// isSystem, accessZoneId, workspace, id) -- only the fields this filter
// actually reads. Folder's own upward pointer is `parent` and can target a
// Folder or a Program. Folder carries the archive flag.
export type MarketoFolderRecord = {
  id: number;
  name: string;
  isArchive: boolean;
  parent?: { id: number; type: MarketoAssetContainerType };
};

// Program has no isArchive of its own -- Adobe's documented Program schema
// (id, name, description, createdAt, updatedAt, url, type, channel, folder,
// status, workspace, tags, costs, headStart) has no archive flag. Its
// upward pointer is `folder`, not `parent`. Adobe's example response always
// shows this pointing at a Folder, but that is one example, not a
// documented constraint -- nothing in the public spec rules out a Program
// nested under another Program via this same field. Treat
// MarketoAssetContainerRef.type here as genuinely either value; the
// recursive walk in getMarketoForms.ts already dispatches on it rather
// than assuming Folder.
export type MarketoProgramRecord = {
  id: number;
  name: string;
  folder?: MarketoAssetContainerRef;
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
