import { FieldsConfig } from './AppConfig/fields';

export interface ConfigurationParameters {
  projectKey?: string;
  clientId?: string;
  clientSecret?: string;
  apiEndpoint?: string;
  authApiEndpoint?: string;
  locale?: string;
  fieldsConfig?: FieldsConfig;
}

export type Hash = Record<string, any>;

export interface Category {
  slug: string;
  id: string;
  name: string;
  externalLink?: string;
  isMissing?: boolean;
}

export interface Product {
  sku: string;
  image: string;
  id: string;
  name: string;
  externalLink?: string;
  isMissing?: boolean;
}

export type PreviewsFn = (skus: string[]) => Promise<Product[]>;

export type DeleteFn = (index: number) => void;

export type PickerMode = 'product' | 'category';
