import { FieldType, FieldLinkType } from '@contentful/app-sdk';

function fieldQuery(field: Field) {
  if (field.type === 'Link') {
    if (field.linkType === 'Entry') {
      return linkQuery(field, field.fields?.join(' '));
    } else if (field.linkType === 'Asset') {
      return linkQuery(field, IMAGE_FIELDS);
    }
  } else if (field.type === 'Array') {
    if (field.items.type === 'Symbol') {
      return basicQuery(field as BasicArrayField);
    } else if (field.items.type === 'Link') {
      if (field.items.linkType === 'Asset') {
        return arrayQuery(field, IMAGE_FIELDS);
      } else if (field.items.linkType === 'Entry') {
        // TODO: what if multiple different content types were selected?
        return arrayQuery(field, field.items.fields?.join(' '));
      }
    }
  } else {
    return basicQuery(field as BasicField);
  }
}
function basicQuery(field: BasicField | BasicArrayField): string {
  return field.id;
}
function linkQuery(field: LinkField, entryFields: string = 'hola'): string {
  return `${field.id} {${entryFields}}`;
}
function arrayQuery(field: BasicArrayField | LinkArrayField, entryFields: string = 'hola'): string {
  return `${field.id} {items {${entryFields}}}`;
}
const IMAGE_FIELDS = 'title description url';

type BasicField = {
  id: string;
  type: Exclude<FieldType, 'Array' | 'Link'>;
};

type LinkField = {
  id: string;
  type: 'Link';
  linkType: FieldLinkType;
  fields?: string[];
};

type BasicArrayField = {
  id: string;
  type: 'Array';
  items: {
    type: 'Symbol';
  };
};

type LinkArrayField = {
  id: string;
  type: 'Array';
  items: {
    type: 'Link';
    linkType: FieldLinkType;
    fields?: string[];
  };
};

export type Field = BasicField | LinkField | BasicArrayField | LinkArrayField;

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
