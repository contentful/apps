import { Field } from './Field';
import { ReferenceItem } from './ReferenceItem';

export class ReferenceArrayField extends Field {
  public items: ReferenceItem[];

  constructor(id: string, entryContentTypeId: string, localized: boolean, items: ReferenceItem[]) {
    super(id, entryContentTypeId, localized);
    items.forEach((item) => (item.parent = this));
    this.items = items;
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

  select(): void {
    this.selected = true;
    this.items.forEach((item) => item.select());
    if (this.parent) {
      this.parent.childSelected();
    }
  }

  deselect(): void {
    this.selected = false;
    this.items.forEach((item) => item.deselect());
    if (this.parent) {
      this.parent.childDeselected();
    }
  }

  childSelected(): void {
    if (this.items.every((item) => item.selected)) {
      this.selected = true;
    }
    if (this.parent) {
      this.parent.childSelected();
    }
  }

  childDeselected(): void {
    if (this.items.every((item) => !item.selected)) {
      this.selected = false;
    }
    if (this.parent) {
      this.parent.childDeselected();
    }
  }

  getAllFields(): Field[] {
    const fields: Field[] = [this];
    this.items.forEach((item) => {
      fields.push(...item.getAllFields());
    });
    return fields;
  }

  private selectedItems(): ReferenceItem[] {
    return this.items.filter((item) => item.selected);
  }
}
