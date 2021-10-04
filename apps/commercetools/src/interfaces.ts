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

export type ProductPreviewsFn = (skus: string[]) => Promise<Product[]>;
export type CategoriesPreviewsFn = (skus: string[]) => Promise<Category[]>;

export type DeleteFn = (index: number) => void;

export type PickerMode = 'product' | 'category';

export interface FieldItems {
  type: string;
}

export interface Field {
  id: string;
  name: string;
  type: string;
  items?: FieldItems;
}

export interface ContentType {
  sys: { id: string };
  name: string;
  fields?: Field[];
}

export interface Control {
  fieldId: string;
  widgetNamespace: string;
  widgetId: string;
}

export interface EditorInterface {
  sys: { contentType: { sys: { id: string } } };
  controls?: Control[];
}
