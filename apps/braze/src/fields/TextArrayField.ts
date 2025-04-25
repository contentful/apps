import { Field } from './Field';
import { FieldRegistry } from './fieldRegistry';

export class TextArrayField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  get type(): string {
    return 'TextArrayField';
  }

  static fromSerialized(serializedField: any): TextArrayField {
    const field = new TextArrayField(
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
    return [
      `{% for ${this.id}Item in ${template}.${this.id} %}
  {{${this.id}Item}}
{% endfor %}`,
    ];
  }
}

FieldRegistry.registerFieldType('TextArrayField', TextArrayField.fromSerialized);
