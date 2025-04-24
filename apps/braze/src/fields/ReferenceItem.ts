import { capitalize } from '../utils';
import { Entry } from './Entry';
import { Field } from './Field';
import { ReferenceField } from './ReferenceField';

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
    this.referenceContentTypeName = referenceContentTypeName;
    this.title = title;
    fields.forEach((field) => (field.parent = this));
  }

  get type(): string {
    return 'ReferenceItem';
  }

  static fromSerialized(serializedField: any): ReferenceItem {
    const deserializedFields = serializedField.fields.map((f: any) => Entry.deserializeField(f));

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
