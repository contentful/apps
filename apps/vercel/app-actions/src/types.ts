export interface ActionError {
  type: string;
  message: string;
  details?: Record<string, any>;
}

export interface AppActionCallResponseSuccess<TResult> {
  ok: true;
  data: TResult;
}

export interface AppActionCallResponseError {
  ok: false;
  error: ActionError;
}

export type AppActionCallResponse<T> = AppActionCallResponseSuccess<T> | AppActionCallResponseError;

// these content preview types are copied from user interface core typings
export type ContentPreviewConfiguration = {
  contentType: string;
  enabled: boolean;
  example: boolean;
  url: string;

  // TODO: figure out what's appropriate here. For now an empty array is the only allowed value
  contentTypeFields: [];
  name: string;
};

export type ContentPreviewEnvironment = {
  sys: { id: string; type: 'PreviewEnvironment'; version: number };
  name: string;
  description: string;
  configurations: ContentPreviewConfiguration[];
  envId: string;
};

export type ContentTypePreviewPathSelection = {
  contentType: string;
  previewPath: string;
};

export interface AppInstallationContextProps {
  spaceId: string;
  environmentId: string;
  appInstallationId: string;
}

/* START copied over from frontend app installation types */

export interface AppInstallationParameters {
  vercelAccessToken: string;
  selectedProject: string;
  contentTypePreviewPathSelections: ContentTypePreviewPathSelection[];
  selectedApiPath: string;
  teamId: string;
}

/* END copied over from frontend app installation types */

export interface VercelPreviewUrlParts {
  origin: string;
  xVercelProtectionBypass: string;
}

export interface VercelProject {
  targets: {
    production: {
      url: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  protectionBypass: Record<string, { [key: string]: any }>;
  [key: string]: any;
}
