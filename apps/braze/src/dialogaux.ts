import { FieldType, FieldLinkType } from '@contentful/app-sdk';

function fieldQuery(field: Field) {
  if (field.type === 'Link') {
    if (field.linkType === 'Entry') {
      return entryQuery(field);
    } else if (field.linkType === 'Asset') {
      return assetQuery(field);
    }
  } else if (field.type === 'Array') {
    if (field.items.type === 'Symbol') {
      return basicQuery(field as BasicArrayField);
    } else if (field.items.type === 'Link') {
      if (field.items.linkType === 'Asset') {
        if (field.items.type === 'Link' && field.items.linkType === 'Asset') {
          return assetArrayQuery(field as AssetArrayField);
        }
      } else if (field.items.linkType === 'Entry') {
        // TODO: what if multiple different content types were selected?
        if (
          field.items.type === 'Link' &&
          field.items.linkType === 'Entry' &&
          'entryType' in field.items &&
          'fields' in field.items
        ) {
          return entryArrayQuery(field as EntryArrayField);
        }
      }
    }
  } else {
    return basicQuery(field as BasicField);
  }
}
function basicQuery(field: BasicField | BasicArrayField): string {
  return field.id;
}
function assetQuery(field: AssetField): string {
  return `${field.id} {${IMAGE_FIELDS}}`;
}
function entryQuery(field: EntryField): string {
  const entryFields = field.fields?.join(' ');
  const entryType = field.entryType.charAt(0).toUpperCase() + field.entryType.slice(1);
  return `${field.id} {... on ${entryType} {${entryFields}}}`;
}
function assetArrayQuery(field: AssetArrayField): string {
  return `${field.id}Collection {items {${IMAGE_FIELDS}}}`;
}
function entryArrayQuery(field: EntryArrayField): string {
  // TODO: generalize entry fields, they could also be references or arrays
  const entryFields = field.items.fields?.join(' ');
  const entryType = field.items.entryType.charAt(0).toUpperCase() + field.items.entryType.slice(1);
  return `${field.id}Collection {items {... on ${entryType} {${entryFields}}}}`;
}

const IMAGE_FIELDS = 'title description url';

type BasicField = {
  id: string;
  type: Exclude<FieldType, 'Array' | 'Link'>;
};

type AssetField = {
  id: string;
  type: 'Link';
  linkType: 'Asset';
};

type EntryField = {
  id: string;
  type: 'Link';
  linkType: 'Entry';
  entryType: string;
  fields: string[];
};

type BasicArrayField = {
  id: string;
  type: 'Array';
  items: {
    type: 'Symbol';
  };
};

type AssetArrayField = {
  id: string;
  type: 'Array';
  items: {
    type: 'Link';
    linkType: 'Asset';
  };
};

type EntryArrayField = {
  id: string;
  type: 'Array';
  items: {
    type: 'Link';
    linkType: 'Entry';
    entryType: string;
    fields: string[];
  };
};

export type Field =
  | BasicField
  | AssetField
  | EntryField
  | BasicArrayField
  | AssetArrayField
  | EntryArrayField;

function assembleFieldsQuery(entryFields: Field[]): string {
  return entryFields.map((field) => fieldQuery(field)).join(' ');
}

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
