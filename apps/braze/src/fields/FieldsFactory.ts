import { PlainClientAPI } from 'contentful-management';
import { Field } from './Field';
import { AssetArrayField } from './AssetArrayField';
import { AssetField } from './AssetField';
import { BasicField } from './BasicField';
import { LocationField } from './LocationField';
import { ReferenceArrayField } from './ReferenceArrayField';
import { ReferenceField } from './ReferenceField';
import { ReferenceItem } from './ReferenceItem';
import { RichTextField } from './RichTextField';
import { TextArrayField } from './TextArrayField';

export class FieldsFactory {
  static NESTED_DEPTH = 5;
  private constructor() {}

  public static async createFields(
    entry: any,
    cma: PlainClientAPI,
    depth: number = 1
  ): Promise<Field[]> {
    const contentType = await cma.contentType.get({ contentTypeId: entry.sys.contentType.sys.id });
    const contentTypeId = entry.sys.contentType.sys.id;
    const fields = [];
    for (const [name, fieldsValues] of Object.entries(entry.fields)) {
      const field = Object.values(fieldsValues as { [key: string]: any })[0];
      const fieldInfo = contentType.fields.find((f) => f.id === name);
      if (!fieldInfo) {
        throw new Error('Field not found');
      }
      const localized = fieldInfo.localized;

      if (fieldInfo.type === 'Link') {
        if (fieldInfo.linkType === 'Asset') {
          const newField = new AssetField(name, contentTypeId, localized);
          fields.push(newField);
        } else {
          if (depth >= this.NESTED_DEPTH) {
            continue;
          }
          const newField = new ReferenceField(
            name,
            contentTypeId,
            localized,
            field.sys.contentType.sys.id,
            await this.createFields(field, cma, depth + 1)
          );
          fields.push(newField);
        }
      } else if (fieldInfo.type === 'Array') {
        if (fieldInfo.items && fieldInfo.items.type === 'Symbol') {
          const newField = new TextArrayField(name, contentTypeId, localized);
          fields.push(newField);
        } else if (fieldInfo.items && fieldInfo.items.linkType === 'Asset') {
          const newField = new AssetArrayField(name, contentTypeId, localized);
          fields.push(newField);
        } else {
          if (depth >= this.NESTED_DEPTH) {
            continue;
          }
          const items = await Promise.all(
            field.map(async (f: any, index: number) => {
              return new ReferenceItem(
                `[${index}]`,
                contentTypeId,
                fieldInfo.localized,
                f.sys.contentType.sys.id,
                await this.createFields(f, cma, depth + 1)
              );
            })
          );
          const newField = new ReferenceArrayField(name, contentTypeId, localized, items);
          fields.push(newField);
        }
      } else {
        if (fieldInfo.type === 'RichText') {
          const newField = new RichTextField(name, contentTypeId, localized);
          fields.push(newField);
        } else if (fieldInfo.type === 'Location') {
          const newField = new LocationField(name, contentTypeId, localized);
          fields.push(newField);
        } else {
          const newField = new BasicField(name, contentTypeId, localized);
          fields.push(newField);
        }
      }
    }
    return fields;
  }
}
