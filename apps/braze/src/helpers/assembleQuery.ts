import { FieldType } from '@contentful/app-sdk';
import { ASSET_FIELDS_QUERY, SAVED_RESPONSE } from './utils';

export type BasicField = {
  id: string;
  localized: boolean;
  type: Exclude<FieldType, 'Array' | 'Link'>;
};

export type AssetField = {
  id: string;
  localized: boolean;
  type: 'Link';
  linkType: 'Asset';
};

export type EntryField = {
  id: string;
  localized: boolean;
  type: 'Link';
  linkType: 'Entry';
  entryContentType: string;
  fields: Field[];
};

type EntryItem = {
  type: 'Link';
  linkType: 'Entry';
  entryContentType: string;
  fields: Field[];
};

type AssetItem = {
  type: 'Link';
  linkType: 'Asset';
};

type SymbolItem = {
  type: 'Symbol';
};

export type BasicArrayField = {
  id: string;
  localized: boolean;
  type: 'Array';
  arrayType: 'Symbol';
  items: SymbolItem;
};

export type AssetArrayField = {
  id: string;
  localized: boolean;
  type: 'Array';
  arrayType: 'Asset';
  items: AssetItem;
};

export type EntryArrayField = {
  id: string;
  localized: boolean;
  type: 'Array';
  arrayType: 'Entry';
  items: EntryItem[];
};

export type Field =
  | BasicField
  | AssetField
  | EntryField
  | BasicArrayField
  | AssetArrayField
  | EntryArrayField;

export function generateConnectedContentCall(query: string, spaceId: string, token: string) {
  return `
  {% capture body %}
  ${query}
  {% endcapture %}

  {% connected_content
    https://graphql.contentful.com/content/v1/spaces/${spaceId}
    :method post
    :headers {"Authorization": "Bearer ${token}"}
    :body {{body}}
    :content_type application/json
    :save ${SAVED_RESPONSE}
  %}`;
}

export async function getGraphQLResponse(spaceId: string, token: string, query: string) {
  const response = await fetch(`https://graphql.contentful.com/content/v1/spaces/${spaceId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: query,
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export function assembleQuery(contentTypeId: string, entryId: string, entryFields: Field[]) {
  return `{"query":"{${contentTypeId}(id:\\"${entryId}\\"){${assembleFieldsQuery(entryFields)}}}"}`;
}

function assembleFieldsQuery(entryFields: Field[]): string {
  return entryFields.map((field) => fieldQuery(field)).join(' ');
}

function fieldQuery(field: Field) {
  if (field.type === 'Link') {
    if (field.linkType === 'Entry') {
      return entryQuery(field);
    } else if (field.linkType === 'Asset') {
      return assetQuery(field);
    }
  } else if (field.type === 'Array') {
    if (field.arrayType === 'Entry') {
      return entryArrayQuery(field as EntryArrayField);
    } else if (field.arrayType === 'Symbol') {
      return basicQuery(field as BasicArrayField);
    } else if (field.arrayType === 'Asset') {
      return assetArrayQuery(field as AssetArrayField);
    }
  } else {
    return basicQuery(field as BasicField);
  }
}

function basicQuery(field: BasicField | BasicArrayField): string {
  switch (field.type) {
    case 'RichText':
      return `${field.id} {json}`;
    case 'Location':
      return `${field.id} {lat lon}`;
    default:
      return field.id;
  }
}

function assetQuery(field: AssetField): string {
  return `${field.id} {${ASSET_FIELDS_QUERY}}`;
}

function entryQuery(field: EntryField): string {
  const entryFields = fragmentQuery(field);
  const entryType = capitalize(field.entryContentType);
  return `${field.id} {... on ${entryType} {${entryFields}}}`;
}

function assetArrayQuery(field: AssetArrayField): string {
  return `${field.id}Collection {items {${ASSET_FIELDS_QUERY}}}`;
}

function entryArrayQuery(field: EntryArrayField): string {
  const fragments = field.items.map((item) => ({
    fragment: fragmentQuery(item),
    contentType: capitalize(item.entryContentType),
  }));
  const queries = fragments.map(
    ({ fragment, contentType }) => `... on ${contentType} {${fragment}}`
  );
  return `${field.id}Collection {items {${queries.join(' ')}}}`;
}

function fragmentQuery(field: EntryItem): string {
  return field.fields.map((field) => fieldQuery(field)).join(' ');
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
