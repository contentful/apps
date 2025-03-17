import { capitalize, SAVED_RESPONSE } from '../utils';
import { Field } from './Field';

export class ReferenceField extends Field {
  public referenceContentType: string;
  public fields: Field[];

  constructor(
    id: string,
    entryContentTypeId: string,
    localized: boolean,
    referenceContentType: string,
    fields: Field[]
  ) {
    super(id, entryContentTypeId, localized);
    this.referenceContentType = referenceContentType;
    this.fields = fields;
  }

  generateQuery(): string {
    const referenceFields = this.fields.map((field) => field.generateQuery()).join(' ');
    const referenceType = capitalize(this.referenceContentType);
    return `${this.id} {... on ${referenceType} {${referenceFields}}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return this.fields.flatMap((field) => field.generateLiquidTagForType(`${template}.${this.id}`));
  }
}
