import { FieldType } from '@contentful/app-sdk';
import { Field } from './Field';

export class BasicField extends Field {
  public type: string;

  LOCATION_LAT = 'lat';
  LOCATION_LON = 'lon';

  constructor(
    id: string,
    entryContentTypeId: string,
    localized: boolean,
    type: Exclude<FieldType, 'Array' | 'Link'>
  ) {
    super(id, entryContentTypeId, localized);
    this.type = type;
  }

  generateQuery(): string {
    switch (this.type) {
      case 'RichText':
        return '';
      case 'Location':
        return `${this.id} {lat lon}`;
      default:
        return this.id;
    }
  }

  generateLiquidTagForType(template: string): string[] {
    switch (this.type) {
      case 'RichText':
        return [];
      case 'Location':
        return [
          `{{${template}.${this.id}.${this.LOCATION_LAT}}}`,
          `{{${template}.${this.id}.${this.LOCATION_LON}}}`,
        ];
      default:
        return [`{{${template}.${this.id}}}`];
    }
  }
}
