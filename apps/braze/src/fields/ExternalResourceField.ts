import { Field } from './Field';
import { FieldRegistry } from './fieldRegistry';

export class ExternalResourceField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  get type(): string {
    return 'ExternalResourceField';
  }

  public override set selected(value: boolean) {
    return;
  }

  static fromSerialized(serializedField: any): ExternalResourceField {
    const field = new ExternalResourceField(
      serializedField.id,
      serializedField.name,
      serializedField.entryContentTypeId,
      serializedField.localized
    );
    return field;
  }

  generateQuery(): string {
    throw new Error('External resource not supported');
  }

  generateLiquidTagForType(template: string): string[] {
    throw new Error('External resource not supported');
  }

  isEnabledForGenerate(): boolean {
    return false;
  }

  isEnabledForCreate(): boolean {
    return false;
  }
}

FieldRegistry.registerFieldType('ExternalResourceField', ExternalResourceField.fromSerialized);
