import { FieldType } from 'contentful-management';

export type ColumnOption = {
  label: string;
  value: string;
};

export type ContentTypeField = {
  id: string;
  uniqueId: string;
  name: string;
  locale?: string;
} & FieldType;

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

export interface Status {
  label: string;
  color: 'primary' | 'positive' | 'negative' | 'warning';
}
