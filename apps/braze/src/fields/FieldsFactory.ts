import { ContentTypeProps, PlainClientAPI } from 'contentful-management';
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
  private contentTypes: { [key: string]: ContentTypeProps };
  private cma: PlainClientAPI;
  NESTED_DEPTH = 5;

  public constructor(cma: PlainClientAPI) {
    this.cma = cma;
    this.contentTypes = {};
  }

  public async createFields(entry: any, depth: number = 1): Promise<Field[]> {
    const contentType = await this.getContentType(entry.sys.contentType.sys.id);
    const contentTypeId = entry.sys.contentType.sys.id;
    const fields = [];
    for (const [fieldId, fieldValues] of Object.entries(entry.fields)) {
      const field = Object.values(fieldValues as { [key: string]: any })[0];
      const fieldInfo = contentType.fields.find((f) => f.id === fieldId);
      if (!fieldInfo) {
        throw new Error('Field not found');
      }
      const fieldName = fieldInfo.name;
      const localized = fieldInfo.localized;

      if (fieldInfo.type === 'Link') {
        if (fieldInfo.linkType === 'Asset') {
          const newField = new AssetField(fieldId, fieldName, contentTypeId, localized);
          fields.push(newField);
        } else {
          if (depth >= this.NESTED_DEPTH) {
            continue;
          }
          const fieldContentType = await this.getContentType(field.sys.contentType.sys.id);
          const title = !!fieldContentType.displayField
            ? Object.values(
                field.fields[fieldContentType.displayField] as { [key: string]: any }
              )[0]
            : 'Untitled';
          const newField = new ReferenceField(
            fieldId,
            fieldName,
            contentTypeId,
            title,
            localized,
            fieldContentType.sys.id,
            fieldContentType.name,
            await this.createFields(field, depth + 1)
          );
          fields.push(newField);
        }
      } else if (fieldInfo.type === 'Array') {
        if (fieldInfo.items && fieldInfo.items.type === 'Symbol') {
          const newField = new TextArrayField(fieldId, fieldName, contentTypeId, localized);
          fields.push(newField);
        } else if (fieldInfo.items && fieldInfo.items.linkType === 'Asset') {
          const newField = new AssetArrayField(fieldId, fieldName, contentTypeId, localized);
          fields.push(newField);
        } else {
          if (depth >= this.NESTED_DEPTH) {
            continue;
          }
          const items = await Promise.all(
            field.map(async (f: any, index: number) => {
              const fieldContentType = await this.getContentType(f.sys.contentType.sys.id);
              return new ReferenceItem(
                crypto.randomUUID(),
                `${fieldName} item #${index + 1}`,
                contentTypeId,
                Object.values(f.fields[fieldContentType.displayField] as { [key: string]: any })[0],
                fieldInfo.localized,
                fieldContentType.sys.id,
                fieldContentType.name,
                await this.createFields(f, depth + 1)
              );
            })
          );
          const newField = new ReferenceArrayField(
            fieldId,
            fieldName,
            contentTypeId,
            localized,
            items
          );
          fields.push(newField);
        }
      } else {
        if (fieldInfo.type === 'RichText') {
          const newField = new RichTextField(fieldId, fieldName, contentTypeId, localized);
          fields.push(newField);
        } else if (fieldInfo.type === 'Location') {
          const newField = new LocationField(fieldId, fieldName, contentTypeId, localized);
          fields.push(newField);
        } else {
          const newField = new BasicField(fieldId, fieldName, contentTypeId, localized);
          fields.push(newField);
        }
      }
    }
    return fields;
  }

  private async getContentType(contentTypeId: string) {
    if (!this.contentTypes[contentTypeId]) {
      this.contentTypes[contentTypeId] = await this.cma.contentType.get({ contentTypeId });
    }
    return this.contentTypes[contentTypeId];
  }
}
