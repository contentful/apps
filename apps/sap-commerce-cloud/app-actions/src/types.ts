export interface Product {
  sku?: string;
  image: string;
  id: string;
  name: string;
  externalLink?: string;
  isMissing?: boolean;
  productUrl: string;
}

export type Hash = Record<string, any>;

export type FieldsConfig = Record<string, Record<string, string | undefined> | undefined>;

export interface ConfigurationParameters {
  projectKey?: string;
  clientId?: string;
  clientSecret?: string;
  apiEndpoint?: string;
  authApiEndpoint?: string;
  locale?: string;
  fieldsConfig?: FieldsConfig;
  baseSites?: string;
}

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

// WIP types
export interface BaseSite {
  channel?: string;
  defaultLanguage?: {
    active: boolean;
    isocode: string;
    name: string;
    nativeName: string;
  };
  isolated: boolean;
  locale?: string;
  name?: string;
  theme?: string;
  uid: string;
}

export type BaseSites = { baseSites: BaseSite[] };

export type AppInstallationParameters = {
  apiEndpoint: string;
  baseSites: string;
};
