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

export async function transformEntryFields(entry: any, cma: PlainClientAPI): Promise<Field[]> {
  const contentType = await cma.contentType.get({ contentTypeId: entry.sys.contentType.sys.id });
  return await Promise.all(
    Object.entries(entry.fields).map(async ([name, fieldsValues]) => {
      const field = Object.values(fieldsValues as { [key: string]: any })[0];
      const fieldInfo = contentType.fields.find((f) => f.id === name);
      if (!fieldInfo) {
        throw new Error('Field not found');
      }
      const localized = fieldInfo.localized;

      if (fieldInfo.type === 'Link') {
        if (fieldInfo.linkType === 'Asset') {
          return assembleAssetField(name, localized);
        } else {
          return await assembleEntryField(name, field, cma, localized);
        }
      } else if (fieldInfo.type === 'Array') {
        if (fieldInfo.items && fieldInfo.items.type === 'Symbol') {
          return assembleBasicArrayField(name, localized);
        } else if (fieldInfo.items && fieldInfo.items.linkType === 'Asset') {
          return assembleAssetArrayField(name, localized);
        } else {
          return await assembleEntryArrayField(name, field, cma, localized);
        }
      } else {
        return assembleBasicField(name, fieldInfo, localized);
      }
    })
  );
}

function assembleBasicField(
  name: string,
  fieldInfo: ContentFields<KeyValueMap>,
  localized: boolean
): BasicField {
  return {
    id: name,
    localized: localized,
    type: fieldInfo.type,
  } as BasicField; // TODO: try to avoid this cast
}

function assembleAssetField(name: string, localized: boolean): AssetField {
  return {
    id: name,
    localized: localized,
    type: 'Link',
    linkType: 'Asset',
  };
}

async function assembleEntryField(
  name: string,
  field: any,
  cma: PlainClientAPI,
  localized: boolean
): Promise<EntryField> {
  return {
    id: name,
    localized: localized,
    type: 'Link',
    linkType: 'Entry',
    entryContentType: field.sys.contentType.sys.id,
    fields: await transformEntryFields(field, cma),
  };
}

function assembleBasicArrayField(name: string, localized: boolean): BasicArrayField {
  return {
    id: name,
    localized: localized,
    type: 'Array',
    arrayType: 'Symbol',
    items: {
      type: 'Symbol',
    },
  };
}

function assembleAssetArrayField(name: string, localized: boolean): AssetArrayField {
  return {
    id: name,
    localized: localized,
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
  cma: PlainClientAPI,
  localized: boolean
): Promise<EntryArrayField> {
  return {
    id: name,
    localized: localized,
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
