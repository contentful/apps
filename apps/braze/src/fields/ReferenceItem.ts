import { capitalize } from '../utils';
import { Field } from './Field';
import { ReferenceField } from './ReferenceField';
import { FieldRegistry } from './fieldRegistry';

export class ReferenceItem extends ReferenceField {
  constructor(
    id: string,
    name: string,
    entryContentTypeId: string,
    title: string,
    localized: boolean,
    referenceContentTypeId: string,
    referenceContentTypeName: string,
    fields: Field[]
  ) {
    super(
      id,
      name,
      entryContentTypeId,
      title,
      localized,
      referenceContentTypeId,
      referenceContentTypeName,
      fields
    );
  }

  get type(): string {
    return 'ReferenceItem';
  }

  static fromSerialized(serializedField: any): ReferenceItem {
    const deserializedFields = serializedField.fields.map((f: any) =>
      FieldRegistry.deserializeField(f)
    );

    const item = new ReferenceItem(
      serializedField.id,
      serializedField.name,
      serializedField.entryContentTypeId,
      serializedField.title,
      serializedField.localized,
      serializedField.referenceContentTypeId,
      serializedField.referenceContentTypeName,
      deserializedFields
    );
    item.selected = serializedField.selected;
    deserializedFields.forEach((f: Field) => (f.parent = item));
    return item;
  }

  generateQuery(): string {
    const itemFields = this.selectedFields()
      .map((field) => field.generateQuery())
      .join(' ');
    const itemContentType = capitalize(this.referenceContentTypeId);
    return `... on ${itemContentType} {${itemFields}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return this.selectedFields().flatMap((field) => field.generateLiquidTagForType(`${template}`));
  }
}

FieldRegistry.registerFieldType('ReferenceItem', ReferenceItem.fromSerialized);
