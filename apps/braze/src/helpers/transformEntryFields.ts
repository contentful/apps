import { BasicField } from '../fields/BasicField';
import { PlainClientAPI } from 'contentful-management';
import { Field } from '../fields/Field';
import { AssetField } from '../fields/AssetField';
import { ReferenceField } from '../fields/ReferenceField';
import { TextArrayField } from '../fields/TextArrayField';
import { AssetArrayField } from '../fields/AssetArrayField';
import { ReferenceArrayField } from '../fields/ReferenceArrayField';
import { ReferenceItem } from '../fields/ReferenceItem';
import { RichTextField } from '../fields/RichTextField';
import { LocationField } from '../fields/LocationField';

const NESTED_DEPTH = 5;

export async function transformEntryFields(
  entry: any,
  cma: PlainClientAPI,
  depth: number = 1
): Promise<Field[]> {
  const contentType = await cma.contentType.get({ contentTypeId: entry.sys.contentType.sys.id });
  const fields = [];
  for (const [name, fieldsValues] of Object.entries(entry.fields)) {
    const field = Object.values(fieldsValues as { [key: string]: any })[0];
    const fieldInfo = contentType.fields.find((f) => f.id === name);
    if (!fieldInfo) {
      throw new Error('Field not found');
    }

    if (fieldInfo.type === 'Link') {
      if (fieldInfo.linkType === 'Asset') {
        const newField = new AssetField(name, contentType.name, fieldInfo.localized);
        fields.push(newField);
      } else {
        if (depth >= NESTED_DEPTH) {
          continue;
        }
        const newField = new ReferenceField(
          name,
          contentType.name,
          fieldInfo.localized,
          field.sys.contentType.sys.id,
          await transformEntryFields(field, cma, depth + 1)
        );
        fields.push(newField);
      }
    } else if (fieldInfo.type === 'Array') {
      if (fieldInfo.items && fieldInfo.items.type === 'Symbol') {
        const newField = new TextArrayField(name, contentType.name, fieldInfo.localized);
        fields.push(newField);
      } else if (fieldInfo.items && fieldInfo.items.linkType === 'Asset') {
        const newField = new AssetArrayField(name, contentType.name, fieldInfo.localized);
        fields.push(newField);
      } else {
        if (depth >= NESTED_DEPTH) {
          continue;
        }
        const items = await Promise.all(
          field.map(async (f: any) => {
            return new ReferenceItem(
              f.sys.contentType.sys.id,
              await transformEntryFields(f, cma, depth + 1)
            );
          })
        );
        const newField = new ReferenceArrayField(
          name,
          contentType.name,
          fieldInfo.localized,
          items
        );
        fields.push(newField);
      }
    } else {
      if (fieldInfo.type === 'RichText') {
        const newField = new RichTextField(name, contentType.name, fieldInfo.localized);
        fields.push(newField);
      } else if (fieldInfo.type === 'Location') {
        const newField = new LocationField(name, contentType.name, fieldInfo.localized);
        fields.push(newField);
      } else {
        const newField = new BasicField(name, contentType.name, fieldInfo.localized);
        fields.push(newField);
      }
    }
  }
  return fields;
}
