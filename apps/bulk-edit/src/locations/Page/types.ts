import { ContentTypeFieldValidation, Control } from 'contentful-management';

export type Item = { type: string; linkType?: string; validations?: ContentTypeFieldValidation[] };

export type FilterOption = {
  label: string;
  value: string;
};

export type FieldFilterValue = {
  fieldUniqueId: string;
  operator:
    | 'in'
    | 'ne'
    | 'match'
    | 'exists'
    | 'not exists'
    | 'all'
    | 'nin'
    | 'is'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte';
  value: string | null;
  entryIds?: string[];
  assetIds?: string[];
  contentTypeField: ContentTypeField;
};

export type ContentTypeField = {
  contentTypeId: string;
  id: string;
  uniqueId: string;
  name: string;
  locale?: string;
  type: string;
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
      | {
          sys: {
            type: 'Link';
            linkType: string;
            id: string;
          };
        }
      | Array<{
          sys: {
            type: 'Link';
            linkType: string;
            id: string;
          };
        }>
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
