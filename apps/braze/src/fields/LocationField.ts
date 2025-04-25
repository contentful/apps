import { Field } from './Field';
import { FieldRegistry } from './fieldRegistry';

export class LocationField extends Field {
  LOCATION_LAT = 'lat';
  LOCATION_LON = 'lon';

  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  get type(): string {
    return 'LocationField';
  }

  static fromSerialized(serializedField: any): LocationField {
    const field = new LocationField(
      serializedField.id,
      serializedField.name,
      serializedField.entryContentTypeId,
      serializedField.localized
    );
    field.selected = serializedField.selected;
    return field;
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

FieldRegistry.registerFieldType('LocationField', LocationField.fromSerialized);
