import { capitalize } from '../utils';
import { Entry } from './Entry';
import { Field } from './Field';

export class ReferenceField extends Field {
  public referenceContentTypeId: string;
  public referenceContentTypeName: string;
  public title: string;
  public fields: Field[];

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
    super(id, name, entryContentTypeId, localized);
    this.referenceContentTypeId = referenceContentTypeId;
    this.referenceContentTypeName = referenceContentTypeName;
    this.title = title;
    fields.forEach((field) => (field.parent = this));
    this.fields = fields;
  }

  get type(): string {
    return 'ReferenceField';
  }

  serialize(): any {
    const base = super.serialize();
    return {
      ...base,
      referenceContentTypeId: this.referenceContentTypeId,
      referenceContentTypeName: this.referenceContentTypeName,
      title: this.title,
      fields: this.fields.map((f) => f.serialize()),
    };
  }

  static fromSerialized(serializedField: any): ReferenceField {
    const deserializedFields = serializedField.fields.map((f: any) => Entry.deserializeField(f));

    const field = new ReferenceField(
      serializedField.id,
      serializedField.name,
      serializedField.entryContentTypeId,
      serializedField.title,
      serializedField.localized,
      serializedField.referenceContentTypeId,
      serializedField.referenceContentTypeName,
      deserializedFields
    );
    field.selected = serializedField.selected;
    deserializedFields.forEach((f: Field) => (f.parent = field));
    return field;
  }

  generateQuery(): string {
    const referenceFields = this.selectedFields()
      .map((field) => field.generateQuery())
      .join(' ');
    const referenceType = capitalize(this.referenceContentTypeId);
    return `${this.id} {... on ${referenceType} {${referenceFields}}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return this.selectedFields().flatMap((field) =>
      field.generateLiquidTagForType(`${template}.${this.id}`)
    );
  }

  displayName(): string {
    return `${this.name} > ${this.title} (${this.referenceContentTypeName})`;
  }

  toggle(selected: boolean) {
    this.selected = selected;
    this.fields.forEach((field) => field.toggle(selected));
    if (this.parent) {
      this.parent.childToggled(selected);
    }
  }

  childToggled(selected: boolean) {
    if (this.fields.some((field) => field.selected)) {
      this.selected = true;
    } else {
      this.selected = false;
    }
    if (this.parent) {
      this.parent.childToggled(selected);
    }
  }

  getChildren(): Field[] {
    const fields: Field[] = [];
    this.fields.forEach((field) => {
      fields.push(...[field, ...field.getChildren()]);
    });
    return fields;
  }

  selectedFields(): Field[] {
    return this.fields.filter((field) => field.selected);
  }
}
