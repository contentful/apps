import * as contentful from 'contentful-management';

/*
 * INTEG-3271: Double check the exported types and make sure they work for Google Docs (use Klaviyo as a reference)
 */
export interface AppEventHandlerRequest {
  headers: {
    'x-contentful-topic': string;
    'x-contentful-space-id': string;
    'x-contentful-environment-id': string;
    [key: string]: string;
  };
  body: any;
  type: string;
  code?: string;
  state?: string;
}

export interface AppEventHandlerResponse {
  // Empty response for event handlers
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

interface AppInstallationParameters {
  privateKey?: string;
  publicKey?: string;
  redirectUri?: string;
  appDefinitionId?: string;
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
