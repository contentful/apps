import { capitalize } from '../utils';
import { Field } from './Field';
import { ReferenceField } from './ReferenceField';

export class ReferenceItem extends ReferenceField {
  constructor(
    id: string,
    name: string,
    entryContentTypeId: string,
    title: string,
    localized: boolean,
    referenceContentTypeId: string,
    referenceContentTypeName: string,
    fields: Field[]
  ) {
    super(
      id,
      name,
      entryContentTypeId,
      title,
      localized,
      referenceContentTypeId,
      referenceContentTypeName,
      fields
    );
    this.referenceContentTypeName = referenceContentTypeName;
    this.title = title;
    fields.forEach((field) => (field.parent = this));
  }

  generateQuery(): string {
    const itemFields = this.selectedFields()
      .map((field) => field.generateQuery())
      .join(' ');
    const itemContentType = capitalize(this.referenceContentTypeId);
    return `... on ${itemContentType} {${itemFields}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return this.selectedFields().flatMap((field) => field.generateLiquidTagForType(`${template}`));
  }

  uniqueId(): string {
    return !!this.parent ? `${this.parent.uniqueId()}${this.id}` : this.id;
  }
}
