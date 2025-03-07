import { useEffect, useState } from 'react';
import {
  AssetArrayField,
  AssetField,
  BasicArrayField,
  BasicField,
  EntryArrayField,
  EntryField,
  Field,
} from './dialogaux';
import { ContentFields, createClient, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { SidebarAppSDK } from '@contentful/app-sdk';
import resolveResponse from 'contentful-resolve-response';

export function useFields(sdk: SidebarAppSDK): Field[] {
  const [entry, setEntry] = useState<Field[]>();
  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );
  useEffect(() => {
    const fetchEntry = async () => {
      const response = await cma.entry.references({ entryId: sdk.ids.entry, include: 10 });
      const items = resolveResponse(response);
      const fields = await transformFields(items[0], cma);
      setEntry(fields);
    };
    fetchEntry();
  }, []);
  return entry ?? [];
}

async function transformFields(fields: any, cma: PlainClientAPI): Promise<Field[]> {
  const contentType = await cma.contentType.get({ contentTypeId: fields.sys.contentType.sys.id });
  const transformedFields = await Promise.all(
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

  return transformedFields;
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
    fields: await transformFields(field, cma),
  };
}

function assembleBasicArrayField(name: string): BasicArrayField {
  return {
    id: name,
    type: 'Array',
    items: {
      type: 'Symbol',
    },
  };
}

function assembleAssetArrayField(name: string): AssetArrayField {
  return {
    id: name,
    type: 'Array',
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
    items: await Promise.all(
      field.map(async (f: any) => ({
        type: 'Link',
        linkType: 'Entry',
        entryContentType: f.sys.contentType.sys.id,
        fields: await transformFields(f, cma),
      }))
    ),
  };
}
