import { ASSET_FIELDS, ASSET_FIELDS_QUERY } from '../utils';
import { Field } from './Field';

export class AssetArrayField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
    this.id = id;
    this.localized = localized;
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
}
