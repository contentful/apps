import { ASSET_FIELDS, ASSET_FIELDS_QUERY } from '../utils';
import { Field } from './Field';
import { FieldRegistry } from './fieldRegistry';

export class AssetField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  get type(): string {
    return 'AssetField';
  }

  static fromSerialized(serializedField: any): AssetField {
    const field = new AssetField(
      serializedField.id,
      serializedField.name,
      serializedField.entryContentTypeId,
      serializedField.localized
    );
    field.selected = serializedField.selected;
    return field;
  }

  generateQuery(): string {
    return `${this.id} {${ASSET_FIELDS_QUERY.join(' ')}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return ASSET_FIELDS.map((assetField) => `{{${template}.${this.id}.${assetField}}}`);
  }

  isEnabledForCreate(): boolean {
    return false;
  }
}

FieldRegistry.registerFieldType('AssetField', AssetField.fromSerialized);
