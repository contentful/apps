import {
  AssetArrayField,
  AssetField,
  BasicArrayField,
  BasicField,
  EntryArrayField,
  EntryField,
  Field,
} from './assembleQuery';
import { ContentFields, KeyValueMap, PlainClientAPI } from 'contentful-management';

export async function transformEntryFields(fields: any, cma: PlainClientAPI): Promise<Field[]> {
  const contentType = await cma.contentType.get({ contentTypeId: fields.sys.contentType.sys.id });
  return await Promise.all(
    Object.entries(fields.fields).map(async ([name, fieldsValues]) => {
      const field = Object.values(fieldsValues as { [key: string]: any })[0];
      const fieldInfo = contentType.fields.find((f) => f.id === name);
      if (!fieldInfo) {
        throw new Error('Field not found');
      }

      if (fieldInfo.type === 'Link') {
        if (fieldInfo.linkType === 'Asset') {
          return assembleAssetField(name);
        } else {
          return await assembleEntryField(name, field, cma);
        }
      } else if (fieldInfo.type === 'Array') {
        if (fieldInfo.items && fieldInfo.items.type === 'Symbol') {
          return assembleBasicArrayField(name);
        } else if (fieldInfo.items && fieldInfo.items.linkType === 'Asset') {
          return assembleAssetArrayField(name);
        } else {
          return await assembleEntryArrayField(name, field, cma);
        }
      } else {
        return assembleBasicField(name, fieldInfo);
      }
    })
  );
}

function assembleBasicField(name: string, fieldInfo: ContentFields<KeyValueMap>): BasicField {
  return {
    id: name,
    type: fieldInfo.type,
  } as BasicField; // TODO: try to avoid this cast
}

function assembleAssetField(name: string): AssetField {
  return {
    id: name,
    type: 'Link',
    linkType: 'Asset',
  };
}

async function assembleEntryField(
  name: string,
  field: any,
  cma: PlainClientAPI
): Promise<EntryField> {
  return {
    id: name,
    type: 'Link',
    linkType: 'Entry',
    entryContentType: field.sys.contentType.sys.id,
    fields: await transformEntryFields(field, cma),
  };
}

function assembleBasicArrayField(name: string): BasicArrayField {
  return {
    id: name,
    type: 'Array',
    arrayType: 'Symbol',
    items: {
      type: 'Symbol',
    },
  };
}

function assembleAssetArrayField(name: string): AssetArrayField {
  return {
    id: name,
    type: 'Array',
    arrayType: 'Asset',
    items: {
      type: 'Link',
      linkType: 'Asset',
    },
  };
}

async function assembleEntryArrayField(
  name: string,
  field: any,
  cma: PlainClientAPI
): Promise<EntryArrayField> {
  return {
    id: name,
    type: 'Array',
    arrayType: 'Entry',
    items: await Promise.all(
      field.map(async (f: any) => ({
        type: 'Link',
        linkType: 'Entry',
        entryContentType: f.sys.contentType.sys.id,
        fields: await transformEntryFields(f, cma),
      }))
    ),
  };
}
