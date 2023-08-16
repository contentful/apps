import type { IdsAPI } from '@contentful/app-sdk';
import type { AssetProps, EntityStatus } from '@contentful/f36-components';
import type { ReactElement } from 'react';

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
  title: string;
  description: string;
  image?: string;
  images?: AssetProps[];
  status?: EntityStatus;
  extras?: JSONObject;
  id?: string;
  availableForSale?: boolean;
}

// the variant states of ProductCard, for now, labeled by location
export type ProductCardType = 'field' | 'dialog';

export type ExternalResourceError = {
  error: string;
  errorMessage: string;
  errorStatus: number;
};

export type RenderDragFn = (props: { drag: ReactElement; isDragging?: boolean }) => ReactElement;
