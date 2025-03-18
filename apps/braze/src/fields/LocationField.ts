import { Field } from './Field';

export class LocationField extends Field {
  LOCATION_LAT = 'lat';
  LOCATION_LON = 'lon';

  constructor(id: string, entryContentTypeId: string, localized: boolean) {
    super(id, entryContentTypeId, localized);
  }

  generateQuery(): string {
    return `${this.id} {lat lon}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return [
      `{{${template}.${this.id}.${this.LOCATION_LAT}}}`,
      `{{${template}.${this.id}.${this.LOCATION_LON}}}`,
    ];
  }
}
