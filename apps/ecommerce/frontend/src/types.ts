import type { IdsAPI } from '@contentful/app-sdk';
import type { EntityStatus } from '@contentful/f36-components';
import type { RenderDragFn } from '@contentful/field-editor-reference/dist/types';
import type { ErrorInfo, FC, ReactNode } from 'react';

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
  sys: {
    type: 'ResourceLink';
    linkType: 'Ecommerce::Product';
    urn: string;
    provider: 'Shopify';
  };
}

export interface HydratedResourceData {
  name?: string;
  description?: string;
  image?: string;
  status?: EntityStatus;
  extras?: {};
}

export interface ResourceCardProps {
  value: ResourceLink;
  data?: HydratedResourceData;
  index?: number;
  total?: number;
  onRemove: Function;
  withDragHandle?: boolean;
  dragHandleRender?: RenderDragFn;
  onMoveToTop?: Function;
  onMoveToBottom?: Function;
}

type ErrorBoundaryErrored = { hasError: true; error: Error; info: ErrorInfo };
type ErrorBoundaryStandby = { hasError: false; error: null; info: null };
export type ErrorBoundaryState = ErrorBoundaryErrored | ErrorBoundaryStandby;

export type ErrorBoundaryProps = {
  children: ReactNode;
  FallbackComponent: FC<ErrorComponentProps>;
};

export interface ErrorComponentProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetErrorHandler: () => void;
}
