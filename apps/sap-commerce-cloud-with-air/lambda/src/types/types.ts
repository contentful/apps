export interface AppConfiguration {
  privateKey: string;
  signingSecret: string;
}

export interface AppInstallationParameters {
  [key: string]: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Hash = Record<string, any>;

type PickerMode = 'product' | 'category';

type FieldsConfig = Record<string, Record<string, PickerMode | undefined> | undefined>;

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

export interface Category {
  slug: string;
  id: string;
  name: string;
  externalLink?: string;
  isMissing?: boolean;
  sku: string;
  image: string;
}

export interface Product {
  sku: string;
  image: string;
  id: string;
  name: string;
  externalLink?: string;
  isMissing?: boolean;
}
