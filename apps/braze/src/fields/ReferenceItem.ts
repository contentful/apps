import { capitalize } from '../utils';
import { Field } from './Field';
import { ReferenceField } from './ReferenceField';

export class ReferenceItem extends ReferenceField {
  constructor(
    id: string,
    entryContentTypeId: string,
    localized: boolean,
    referenceContentType: string,
    fields: Field[]
  ) {
    super(id, entryContentTypeId, localized, referenceContentType, fields);
    fields.forEach((field) => (field.parent = this));
  }

  generateQuery(): string {
    const itemFields = this.selectedFields()
      .map((field) => field.generateQuery())
      .join(' ');
    const itemContentType = capitalize(this.referenceContentType);
    return `... on ${itemContentType} {${itemFields}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return this.selectedFields().flatMap((field) => field.generateLiquidTagForType(`${template}`));
  }

  uniqueId(): string {
    return !!this.parent ? `${this.parent.uniqueId()}${this.id}` : this.id;
  }
}
