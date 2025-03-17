import { Field } from './Field';
import { ReferenceItem } from './ReferenceItem';

export class ReferenceArrayField extends Field {
  public items: ReferenceItem[];

  constructor(id: string, entryContentTypeId: string, localized: boolean, items: ReferenceItem[]) {
    super(id, entryContentTypeId, localized);
    this.items = items;
  }

  generateQuery(): string {
    const fragments = this.items.map((item) => item.generateQuery());
    return `${this.id}Collection {items {${fragments.join(' ')}}}`;
  }

  generateLiquidTagForType(template: string): string[] {
    return this.items.flatMap((item, index) => {
      const referenceItemTemplate = `${template}.${this.id}Collection.items[${index}]`;
      return item.generateLiquidTagForType(referenceItemTemplate);
    });
  }
}
