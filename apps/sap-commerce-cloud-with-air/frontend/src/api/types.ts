import type { IdsAPI } from '@contentful/app-sdk';
import type { EntityStatus } from '@contentful/f36-components';
import type { ErrorInfo, FC, ReactNode } from 'react';
import { KeyValueMap } from 'contentful-management';

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
  status?: EntityStatus;
  extras?: JSONObject;
  id?: string;
  availableForSale?: boolean;
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

export interface ProviderConfig {
  name: string;
  description: string;
  parameterDefinitions: ParameterDefinition[];
  primaryColor: string;
  logoUrl: string;
}

export interface ParameterDefinition {
  id: string;
  name: string;
  description: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

export interface AppInstallationParameters {
  [key: string]: any;
}

export enum FieldType {
  Single = 'single',
  Multiple = 'multiple',
}

export interface DialogInvocationParameters extends KeyValueMap {
  linkType: string;
  fieldType: FieldType;
}

// the variant states of ProductCard, for now, labeled by location
export type ProductCardType = 'field' | 'dialog';

export type ExternalResourceError = {
  error: string;
  errorMessage: string;
  errorStatus: number;
};
