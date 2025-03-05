import { EntryReferenceProps } from 'contentful-management/dist/typings/entities/entry';

interface ResolveResponseOptions {
  removeUnresolved?: boolean;
  itemEntryPoints?: string[];
}

type ReferenceFieldResponse = {
  fields: {};
  sys: {
    type: FieldLinkType;
  };
};

type ReferenceArrayFieldResponse = {
  fields: {};
  sys: {
    type: FieldLinkType;
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

export function resolveResponse(
  response: EntryReferenceProps,
  options?: ResolveResponseOptions
): FieldsResponse[];
