// lambda types

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export interface JSONObject {
  [key: string]: JSONValue;
}

export type ExternalResourceLinkType = `${Capitalize<string>}:${Capitalize<string>}`;

export interface ExternalResourceLink {
  sys: {
    type: 'ResourceLink';
    linkType: ExternalResourceLinkType;
    urn: string;
  };
}

export interface ExternalResource {
  name?: string;
  description?: string;
  image?: string;
  status?: string;
  extras?: JSONObject;
  id?: string;
}

export interface ErrorResponse {
  status: 'error';
  message: string | unknown;
}

export interface AppConfiguration {
  id: string;
  name: string;
  baseUrl: string;
  privateKey: string;
  signingSecret: string;
}

export interface AppInstallationParameters {
  [key: string]: string;
}

export interface RequiredProviderInputs {
  providerUrl: string;
  resourceType: string;
  accessToken?: string;
  shopName?: string;
  resourceId?: string;
}
