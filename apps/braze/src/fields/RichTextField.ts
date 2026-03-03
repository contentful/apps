import { Field } from './Field';
import { FieldRegistry } from './fieldRegistry';

// We are not supporting rich text fields for now
export class RichTextField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  get type(): string {
    return 'RichTextField';
  }

  public override set selected(value: boolean) {
    return;
  }

  static fromSerialized(serializedField: any): RichTextField {
    const field = new RichTextField(
      serializedField.id,
      serializedField.name,
      serializedField.entryContentTypeId,
      serializedField.localized
    );
    return field;
  }

  generateQuery(): string {
    throw new Error('Rich text not supported');
  }

  generateLiquidTagForType(_template: string): string[] {
    throw new Error('Rich text not supported');
  }

  isEnabledForGenerate(): boolean {
    return false;
  }
}

FieldRegistry.registerFieldType('RichTextField', RichTextField.fromSerialized);
