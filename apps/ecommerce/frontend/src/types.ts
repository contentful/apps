import { IdsAPI } from '@contentful/app-sdk';
import { EntityStatus } from '@contentful/f36-components';

// TODO: get this exported from the SDK
declare type EntryScopedIds = 'field' | 'entry' | 'contentType';

export interface ContentfulContext extends Omit<IdsAPI, EntryScopedIds> {
  app?: string;
  location?: string;
  // EntryScopedIds are not always present, but are conditionally when the location is entry field/sidebar/editor
  contentType?: string;
  entry?: string;
  field?: string;
}

export interface ContentfulContextHeaders {
  'X-Contentful-App'?: string;
  'X-Contentful-ContentType'?: string;
  'X-Contentful-Entry'?: string;
  'X-Contentful-Environment'?: string;
  'X-Contentful-EnvironmentAlias'?: string;
  'X-Contentful-Field'?: string;
  'X-Contentful-Location'?: string;
  'X-Contentful-Organization'?: string;
  'X-Contentful-Space'?: string;
  'X-Contentful-User'?: string;
}

export interface ResourceLink {
  type: 'ResourceLink';
  linkType: 'Ecommerce::Product';
  urn: string;
  provider: 'Shopify';
}

export interface EcommerceProductData {
  sys?: ResourceLink;
  name?: string;
  description?: string;
  image?: string;
  status?: EntityStatus;
  extras?: {};
}
