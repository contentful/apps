import { ContentTypeFieldValidation, Control } from 'contentful-management';
import type { DialogsAPI } from '@contentful/app-sdk';

export type Item = { type: string; linkType?: string; validations?: ContentTypeFieldValidation[] };

export type LinkRef = {
  sys: {
    type: 'Link';
    linkType: string;
    id: string;
  };
};

export type FieldValue = string | number | boolean | LinkRef | object | null;

export type DialogsSDK = Pick<DialogsAPI, 'selectSingleEntry'>;

export type FilterOption = {
  label: string;
  value: string;
};

export type ContentTypeField = {
  contentTypeId: string;
  id: string;
  uniqueId: string;
  name: string;
  locale?: string;
  type: string;
  linkType?: string;
  required: boolean;
  items?: Item;
  fieldControl?: Control;
  validations: ContentTypeFieldValidation[];
};

export interface Fields {
  [key: string]: {
    [locale: string]:
      | string
      | number
      | boolean
      | LinkRef
      | Array<LinkRef>
      | object
      | null
      | undefined;
  };
}

export interface Entry {
  sys: {
    id: string;
    contentType: { sys: { id: string } };
    publishedVersion?: number;
    version: number;
  };
  fields: Fields;
}
