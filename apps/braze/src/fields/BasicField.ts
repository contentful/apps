import { Field } from './Field';

// Used for all types (see FieldType from contentful-management) except for arrays, links, rich text and location
export class BasicField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  get type(): string {
    return 'BasicField';
  }

  static fromSerialized(serializedField: any): BasicField {
    const field = new BasicField(
      serializedField.id,
      serializedField.name,
      serializedField.entryContentTypeId,
      serializedField.localized
    );
    field.selected = serializedField.selected;
    return field;
  }

  generateQuery(): string {
    return this.id;
  }

  generateLiquidTagForType(template: string): string[] {
    return [`{{${template}.${this.id}}}`];
  }
}
