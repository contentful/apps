import { FieldType } from '@contentful/app-sdk';

const IMAGE_FIELDS = 'title description url';

export type BasicField = {
  id: string;
  type: Exclude<FieldType, 'Array' | 'Link'>;
};

export type AssetField = {
  id: string;
  type: 'Link';
  linkType: 'Asset';
};

export type EntryField = {
  id: string;
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

export type BasicArrayField = {
  id: string;
  type: 'Array';
  items: {
    type: 'Symbol';
  };
};

export type AssetArrayField = {
  id: string;
  type: 'Array';
  items: {
    type: 'Link';
    linkType: 'Asset';
  };
};

export type EntryArrayField = {
  id: string;
  type: 'Array';
  items: EntryItem[];
};

export type Field =
  | BasicField
  | AssetField
  | EntryField
  | BasicArrayField
  | AssetArrayField
  | EntryArrayField;

export function assembleQuery(
  contentTypeId: string,
  entryId: string,
  entryFields: Field[],
  spaceId: string,
  token: string
) {
  return `
  {% capture body %}
  {"query":"{${contentTypeId}(id:\\"${entryId}\\"){${assembleFieldsQuery(entryFields)}}}"}
  {% endcapture %}

  {% connected_content
    https://graphql.contentful.com/content/v1/spaces/${spaceId}
    :method post
    :headers {"Authorization": "Bearer ${token}"}
    :body {{body}}
    :content_type application/json
    :save response
  %}`;
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
    if (Array.isArray(field.items)) {
      return entryArrayQuery(field as EntryArrayField);
    } else if (field.items.type === 'Symbol') {
      return basicQuery(field as BasicArrayField);
    } else if (field.items.type === 'Link' && field.items.linkType === 'Asset') {
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
  return `${field.id} {${IMAGE_FIELDS}}`;
}

function entryQuery(field: EntryField): string {
  const entryFields = fragmentQuery(field);
  const entryType = capitalize(field.entryContentType);
  return `${field.id} {... on ${entryType} {${entryFields}}}`;
}

function assetArrayQuery(field: AssetArrayField): string {
  return `${field.id}Collection {items {${IMAGE_FIELDS}}}`;
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
