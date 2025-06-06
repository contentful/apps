import { FieldType } from 'contentful-management';

export type ContentTypeField = {
  id: string;
  name: string;
} & FieldType;

export interface Entry {
  sys: {
    id: string;
    contentType: { sys: { id: string } };
    publishedVersion?: number;
    version: number;
  };
  fields: {
    [key: string]: {
      [locale: string]:
        | string
        | number
        | boolean
        | { sys: { type: 'Link'; linkType: string; id: string } }
        | Array<{ sys: { type: 'Link'; linkType: string; id: string } }>
        | object
        | null
        | undefined;
    };
  };
}

export interface Status {
  label: string;
  color: 'primary' | 'positive' | 'negative' | 'warning';
}
