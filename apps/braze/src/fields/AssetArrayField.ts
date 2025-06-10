import { ASSET_FIELDS, ASSET_FIELDS_QUERY } from '../utils';
import { Field } from './Field';
import { FieldRegistry } from './fieldRegistry';

export class AssetArrayField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  get type(): string {
    return 'AssetArrayField';
  }

  static fromSerialized(serializedField: any): AssetArrayField {
    const field = new AssetArrayField(
      serializedField.id,
      serializedField.name,
      serializedField.entryContentTypeId,
      serializedField.localized
    );
    field.selected = serializedField.selected;
    return field;
  }

  generateQuery(): string {
    return `${this.id}Collection {items {${ASSET_FIELDS_QUERY}}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    const items = ASSET_FIELDS.map((assetField) => `  {{${this.id}CollectionItem.${assetField}}}`);

    return [
      `{% for ${this.id}CollectionItem in ${template}.${this.id}Collection.items %}
${items.join('\n')}
{% endfor %}`,
    ];
  }

  isEnabledForCreate(): boolean {
    return false;
  }
}

FieldRegistry.registerFieldType('AssetArrayField', AssetArrayField.fromSerialized);
