import { Field } from './Field';
import { FieldRegistry } from './fieldRegistry';
import { ReferenceItem } from './ReferenceItem';

export class ReferenceArrayField extends Field {
  public items: ReferenceItem[];

  constructor(
    id: string,
    name: string,
    entryContentTypeId: string,
    localized: boolean,
    items: ReferenceItem[]
  ) {
    super(id, name, entryContentTypeId, localized);
    items.forEach((item) => (item.parent = this));
    this.items = items;
  }

  get type(): string {
    return 'ReferenceArrayField';
  }

  serialize(): any {
    const base = super.serialize();
    return {
      ...base,
      items: this.items.map((item) => item.serialize()),
    };
  }

  static fromSerialized(serializedField: any): ReferenceArrayField {
    const deserializedItems = serializedField.items.map((item: any) =>
      ReferenceItem.fromSerialized(item)
    );

    const field = new ReferenceArrayField(
      serializedField.id,
      serializedField.name,
      serializedField.entryContentTypeId,
      serializedField.localized,
      deserializedItems
    );
    field.selected = serializedField.selected;
    deserializedItems.forEach((item: ReferenceItem) => (item.parent = field));
    return field;
  }

  generateQuery(): string {
    const fragments = this.selectedItems().map((item) => item.generateQuery());
    return `${this.id}Collection {items {${fragments.join(' ')}}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return this.selectedItems().flatMap((item, index) => {
      const referenceItemTemplate = `${template}.${this.id}Collection.items[${index}]`;
      return item.generateLiquidTagForType(referenceItemTemplate);
    });
  }

  toggle(selected: boolean) {
    this.selected = selected;
    this.items.forEach((item) => item.toggle(selected));
    if (this.parent) {
      this.parent.childToggled(selected);
    }
  }

  childToggled(selected: boolean) {
    if (this.items.some((item) => item.selected)) {
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
    this.items.forEach((item) => {
      fields.push(...[item, ...item.getChildren()]);
    });
    return fields;
  }

  private selectedItems(): ReferenceItem[] {
    return this.items.filter((item) => item.selected);
  }

  isEnabledForCreate(): boolean {
    return false;
  }
}

FieldRegistry.registerFieldType('ReferenceArrayField', ReferenceArrayField.fromSerialized);
