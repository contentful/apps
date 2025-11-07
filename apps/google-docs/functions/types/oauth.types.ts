import * as contentful from 'contentful-management';

/*
 * INTEG-3271: Double check the exported types and make sure they work for Google Docs (use Klaviyo as a reference)
 */
export interface AppEventHandlerRequest {
  headers: {
    'X-Contentful-Topic': string;
    'x-contentful-space-id': string;
    'x-contentful-environment-id': string;
    [key: string]: string;
  };
  body: any;
  type: string;
  code?: string;
  state?: string;
}

export interface OAuthResponseUrl {
  authorizationUrl: string;
}

export interface OAuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export type OAuthInitResponse = {
  authorizeUrl: string;
};

export type OAuthExchangePayload = {
  code: string;
  state: string;
};

export type OAuthExchangeResponse = {
  success: boolean;
};

export type OAuthTokenResponse = {
  tokenType: string;
  accessToken: string;
  expiry: number;
};

// Define types for field mappings
interface AppFieldMapping {
  contentfulFieldId: string;
  klaviyoBlockName: string;
  fieldType?: string;
  contentTypeId?: string;
  name?: string;
  type?: string;
  severity?: string;
  value?: any;
  isAssetField?: boolean;
  locale?: string;
}

interface SyncStatus {
  entryId: string;
  contentTypeId: string;
  contentTypeName?: string;
  lastSynced: number;
  fieldsUpdatedAt?: Record<string, number>;
  needsSync: boolean;
  syncCompleted: boolean;
  lastSyncedVersion?: number;
}

interface SyncParameters {
  syncStatuses: SyncStatus[];
  lastUpdated: number;
}

// Interface for app installation parameters
interface AppInstallationParameters {
  privateKey?: string;
  publicKey?: string;
  redirectUri?: string;
  fieldMappings?: AppFieldMapping[];
  syncData?: SyncParameters;
  appDefinitionId?: string;
  selectedContentTypes?: Record<string, boolean>;
  contentTypeMappings?: Record<string, AppFieldMapping[]>;
  installation?: any;
  selectedLocales?: string[];
  [key: string]: any;
}

export interface AppEventContext {
  appInstallationId: string;
  spaceId?: string;
  environmentId?: string;
  cma: contentful.PlainClientAPI;
  cmaClientOptions?: {
    accessToken: string;
  };
  cmaToken?: string;
  appInstallationParameters?: AppInstallationParameters;
}
