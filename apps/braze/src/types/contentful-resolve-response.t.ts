declare module 'contentful-resolve-response' {
  import { EntryReferenceProps } from 'contentful-management/dist/typings/entities/entry';
  import { FieldLinkType } from '@contentful/app-sdk';

  interface ResolveResponseOptions {
    removeUnresolved?: boolean;
    itemEntryPoints?: string[];
  }

  type ReferenceFieldResponse = {
    fields: {};
    sys: {
      type: FieldLinkType;
      contentType: {
        sys: {
          id: string;
        };
      };
    };
  };

  type ReferenceArrayFieldResponse = {
    fields: {};
    sys: {
      type: FieldLinkType;
      contentType: {
        sys: {
          id: string;
        };
      };
    };
  }[];

  type BasicArrayFieldResponse = string[];

  type BasicFieldResponse = string;

  export type FieldsResponse = {
    fields: {
      [name: string]: {
        [locale: string]:
          | BasicFieldResponse
          | BasicArrayFieldResponse
          | ReferenceFieldResponse
          | ReferenceArrayFieldResponse;
      };
    };
  };

  export default function resolveResponse(
    response: EntryReferenceProps,
    options?: ResolveResponseOptions
  ): FieldsResponse[];
}
