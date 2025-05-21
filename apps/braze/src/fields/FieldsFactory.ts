import {
  ContentFields,
  ContentTypeProps,
  KeyValueMap,
  PlainClientAPI,
} from 'contentful-management';
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
import resolveResponse from 'contentful-resolve-response';

export class FieldsFactory {
  private contentTypes: { [key: string]: ContentTypeProps };
  private entryId: string;
  private entryContentTypeId: string;
  private cma: PlainClientAPI;
  NESTED_DEPTH = 5;

  public constructor(entryId: string, entryContentTypeId: string, cma: PlainClientAPI) {
    this.entryId = entryId;
    this.entryContentTypeId = entryContentTypeId;
    this.cma = cma;
    this.contentTypes = {};
  }

  public async getEntry() {
    const response = await this.cma.entry.references({ entryId: this.entryId, include: 5 });
    return resolveResponse(response)[0];
  }

  public async createFieldsForEntryLALALA(
    entryFields: any,
    contentType?: ContentTypeProps,
    currentDepth: number = 1
  ): Promise<Field[]> {
    if (!contentType) {
      contentType = await this.getContentType(this.entryContentTypeId);
    }

    const fields = [];
    const entryFieldIds = entryFields.map((field: any) => field.fieldId);
    const newContentTypeFields = contentType.fields.filter((field) =>
      entryFieldIds.includes(field.id)
    );
    console.log('NEW CONTENT TYPE: ', newContentTypeFields);
    for (const fieldInfo of newContentTypeFields) {
      fields.push(this.createSimpleField(fieldInfo, contentType));
    }
    return fields;
  }

  public async createFieldsForEntry(
    entryFields: any,
    contentType?: ContentTypeProps,
    currentDepth: number = 1
  ): Promise<Field[]> {
    if (!contentType) {
      contentType = await this.getContentType(this.entryContentTypeId);
    }

    const fields = [];
    for (const fieldInfo of contentType.fields) {
      if (!this.isReferenceField(fieldInfo) && !this.isReferenceArrayField(fieldInfo)) {
        fields.push(this.createSimpleField(fieldInfo, contentType));
      } else {
        const field = entryFields[fieldInfo.id];
        if (currentDepth >= this.NESTED_DEPTH || !field) {
          continue;
        }
        const fieldValue = Object.values(field as { [key: string]: any })[0];
        if (this.isReferenceField(fieldInfo)) {
          fields.push(
            await this.createReferenceField(fieldInfo, fieldValue, contentType, currentDepth)
          );
        } else if (this.isReferenceArrayField(fieldInfo)) {
          fields.push(
            await this.createReferenceArrayField(fieldInfo, fieldValue, contentType, currentDepth)
          );
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

  private isReferenceField(fieldInfo: ContentFields<KeyValueMap>) {
    return fieldInfo.type === 'Link' && fieldInfo.linkType === 'Entry';
  }

  private isReferenceArrayField(fieldInfo: ContentFields<KeyValueMap>) {
    return fieldInfo.type === 'Array' && fieldInfo.items && fieldInfo.items.linkType === 'Entry';
  }

  private createSimpleField(
    fieldInfo: ContentFields<KeyValueMap>,
    contentType: ContentTypeProps
  ): Field {
    let fieldClass;
    if (fieldInfo.type === 'Link') {
      fieldClass = AssetField;
    } else if (fieldInfo.type === 'Array') {
      if (fieldInfo.items && fieldInfo.items.type === 'Symbol') {
        fieldClass = TextArrayField;
      } else {
        fieldClass = AssetArrayField;
      }
    } else if (fieldInfo.type === 'RichText') {
      fieldClass = RichTextField;
    } else if (fieldInfo.type === 'Location') {
      fieldClass = LocationField;
    } else {
      fieldClass = BasicField;
    }
    return new fieldClass(fieldInfo.id, fieldInfo.name, contentType.sys.id, fieldInfo.localized);
  }

  private async createReferenceField(
    fieldInfo: ContentFields<KeyValueMap>,
    fieldValue: any,
    contentType: ContentTypeProps,
    currentDepth: number
  ): Promise<ReferenceField> {
    console.log('FIELD VALUE: ', fieldValue);
    const fieldContentType = await this.getContentType(fieldValue.sys.contentType.sys.id);
    const title = !!fieldContentType.displayField
      ? Object.values(fieldValue.fields[fieldContentType.displayField] as { [key: string]: any })[0]
      : 'Untitled';

    return new ReferenceField(
      fieldInfo.id,
      fieldInfo.name,
      contentType.sys.id,
      title,
      fieldInfo.localized,
      fieldContentType.sys.id,
      fieldContentType.name,
      await this.createFieldsForEntry(fieldValue.fields, fieldContentType, currentDepth + 1)
    );
  }

  private async createReferenceArrayField(
    fieldInfo: ContentFields<KeyValueMap>,
    fieldValue: any,
    contentType: ContentTypeProps,
    currentDepth: number
  ): Promise<ReferenceArrayField> {
    const items = await Promise.all(
      fieldValue.map(async (f: any, index: number) => {
        const fieldContentType = await this.getContentType(f.sys.contentType.sys.id);
        return new ReferenceItem(
          crypto.randomUUID(),
          `${fieldInfo.name} item #${index + 1}`,
          contentType.sys.id,
          Object.values(f.fields[fieldContentType.displayField] as { [key: string]: any })[0],
          fieldInfo.localized,
          fieldContentType.sys.id,
          fieldContentType.name,
          await this.createFieldsForEntry(f.fields, fieldContentType, currentDepth + 1)
        );
      })
    );

    return new ReferenceArrayField(
      fieldInfo.id,
      fieldInfo.name,
      contentType.sys.id,
      fieldInfo.localized,
      items
    );
  }
}
