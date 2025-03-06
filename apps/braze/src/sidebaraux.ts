import { useEffect, useState } from 'react';
import { Field } from './dialogaux';
import { createClient } from 'contentful-management';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { FieldsResponse } from 'contentful-resolve-response';
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
      const fields = transformFields(items[0]);
      setEntry(fields);
    };
    fetchEntry();
  }, []);
  return entry ?? [];
}

function transformFields(fields: FieldsResponse): Field[] {
  return Object.entries(fields.fields).map(([name, fieldsValues]) => {
    const field = Object.values(fieldsValues)[0]; // TODO: what if no locales?

    if (field instanceof Object && !(field instanceof Array) && field.fields !== undefined) {
      if (field.sys.type === 'Asset') {
        return {
          id: name,
          type: 'Link',
          linkType: 'Asset',
        };
      } else {
        return {
          id: name,
          type: 'Link',
          linkType: field.sys.type,
          entryType: field.sys.contentType.sys.id,
          fields: Object.keys(field.fields),
        };
      }
    } else if (field instanceof Array) {
      if (field[0] instanceof Object) {
        if (field[0].sys.type === 'Asset') {
          return {
            id: name,
            type: 'Array',
            items: {
              type: 'Link',
              linkType: 'Asset',
            },
          };
        } else {
          return {
            id: name,
            type: 'Array',
            items: {
              type: 'Link',
              linkType: field[0].sys.type,
              fields: Object.keys(field[0].fields),
              entryType: field[0].sys.contentType.sys.id,
            },
          };
        }
      } else {
        return {
          id: name,
          type: 'Array',
          items: {
            type: 'Symbol',
          },
        };
      }
    } else {
      return {
        id: name,
        type: 'Symbol',
      };
    }
  });
}
