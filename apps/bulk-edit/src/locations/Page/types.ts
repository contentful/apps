import { ContentTypeFieldValidation } from 'contentful-management';

export type Item = { type: string; linkType?: string; validations?: ContentTypeFieldValidation[] };

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
  items?: Item;
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
