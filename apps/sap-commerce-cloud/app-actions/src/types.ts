export interface Product {
  sku: string;
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
