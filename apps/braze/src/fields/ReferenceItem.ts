import { capitalize } from '../utils';
import { Field } from './Field';

export class ReferenceItem {
  public referenceContentType: string;
  public fields: Field[];

  constructor(referenceContentType: string, fields: Field[]) {
    this.referenceContentType = referenceContentType;
    this.fields = fields;
  }

  generateQuery(): string {
    const itemFields = this.fields.map((field) => field.generateQuery()).join(' ');
    const itemContentType = capitalize(this.referenceContentType);
    return `... on ${itemContentType} {${itemFields}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return this.fields.flatMap((field) => field.generateLiquidTagForType(`${template}`));
  }
}
