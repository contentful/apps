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
    fields.forEach((field) => (field.parent = this));
    this.fields = fields;
  }

  generateQuery(): string {
    const referenceFields = this.selectedFields()
      .map((field) => field.generateQuery())
      .join(' ');
    const referenceType = capitalize(this.referenceContentType);
    return `${this.id} {... on ${referenceType} {${referenceFields}}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return this.selectedFields().flatMap((field) =>
      field.generateLiquidTagForType(`${template}.${this.id}`)
    );
  }

  select(): void {
    this.selected = true;
    this.fields.forEach((field) => field.select());
    if (this.parent) {
      this.parent.childSelected();
    }
  }

  deselect(): void {
    this.selected = false;
    this.fields.forEach((field) => field.deselect());
    if (this.parent) {
      this.parent.childDeselected();
    }
  }

  childSelected(): void {
    if (this.fields.every((field) => field.selected)) {
      this.selected = true;
    }
    if (this.parent) {
      this.parent.childSelected();
    }
  }

  childDeselected(): void {
    if (this.fields.every((field) => !field.selected)) {
      this.selected = false;
    }
    if (this.parent) {
      this.parent.childDeselected();
    }
  }

  getAllFields(): Field[] {
    const fields: Field[] = [this];
    this.fields.forEach((field) => {
      fields.push(...field.getAllFields());
    });
    return fields;
  }

  protected selectedFields(): Field[] {
    return this.fields.filter((field) => field.selected);
  }
}
