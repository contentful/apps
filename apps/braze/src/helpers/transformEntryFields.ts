import { FieldType } from '@contentful/app-sdk';
import { BasicField } from '../fields/BasicField';
import { PlainClientAPI } from 'contentful-management';
import { Field } from '../fields/Field';
import { AssetField } from '../fields/AssetField';
import { ReferenceField } from '../fields/ReferenceField';
import { BasicArrayField } from '../fields/BasicArrayField';
import { AssetArrayField } from '../fields/AssetArrayField';
import { ReferenceArrayField } from '../fields/ReferenceArrayField';
import { ReferenceItem } from '../fields/ReferenceItem';

export async function transformEntryFields(entry: any, cma: PlainClientAPI): Promise<Field[]> {
  const contentType = await cma.contentType.get({ contentTypeId: entry.sys.contentType.sys.id });
  return await Promise.all(
    Object.entries(entry.fields).map(async ([name, fieldsValues]) => {
      const field = Object.values(fieldsValues as { [key: string]: any })[0];
      const fieldInfo = contentType.fields.find((f) => f.id === name);
      if (!fieldInfo) {
        throw new Error('Field not found');
      }

      if (fieldInfo.type === 'Link') {
        if (fieldInfo.linkType === 'Asset') {
          return new AssetField(name, contentType.name, fieldInfo.localized);
        } else {
          return new ReferenceField(
            name,
            contentType.name,
            fieldInfo.localized,
            field.sys.contentType.sys.id,
            await transformEntryFields(field, cma)
          );
        }
      } else if (fieldInfo.type === 'Array') {
        if (fieldInfo.items && fieldInfo.items.type === 'Symbol') {
          return new BasicArrayField(name, contentType.name, fieldInfo.localized);
        } else if (fieldInfo.items && fieldInfo.items.linkType === 'Asset') {
          return new AssetArrayField(name, contentType.name, fieldInfo.localized);
        } else {
          const items = await Promise.all(
            field.map(async (f: any) => {
              return new ReferenceItem(
                f.sys.contentType.sys.id,
                await transformEntryFields(f, cma)
              );
            })
          );
          return new ReferenceArrayField(name, contentType.name, fieldInfo.localized, items);
        }
      } else {
        return new BasicField(
          name,
          contentType.name,
          fieldInfo.localized,
          fieldInfo.type as Exclude<FieldType, 'Array' | 'Link'>
        );
      }
    })
  );
}
