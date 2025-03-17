import { ASSET_FIELDS, ASSET_FIELDS_QUERY } from '../utils';
import { Field } from './Field';

export class AssetField extends Field {
  constructor(id: string, entryContentTypeId: string, localized: boolean) {
    super(id, entryContentTypeId, localized);
  }

  generateQuery(): string {
    return `${this.id} {${ASSET_FIELDS_QUERY.join(' ')}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return ASSET_FIELDS.map((assetField) => `{{${template}.${this.id}.${assetField}}}`);
  }
}
