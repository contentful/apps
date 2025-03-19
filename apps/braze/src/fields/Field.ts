import { firstLetterToLowercase, SAVED_RESPONSE } from '../utils';
import { ReferenceArrayField } from './ReferenceArrayField';
import { ReferenceField } from './ReferenceField';
import { ReferenceItem } from './ReferenceItem';

export abstract class Field {
  public id: string;
  public localized: boolean;
  public entryContentTypeId: string;
  public selected: boolean = false;
  public parent: ReferenceField | ReferenceArrayField | ReferenceItem | null = null;

  constructor(id: string, entryContentTypeId: string, localized: boolean) {
    this.id = firstLetterToLowercase(id);
    this.entryContentTypeId = firstLetterToLowercase(entryContentTypeId);
    this.localized = localized;
  }

  abstract generateQuery(): string;
  public abstract generateLiquidTagForType(template: string): string[];

  generateLiquidTag(): string[] {
    const template = `${SAVED_RESPONSE}.data.${this.entryContentTypeId}`;
    return this.generateLiquidTagForType(template);
  }

  select(): void {
    this.selected = true;
    if (this.parent) {
      this.parent.childSelected();
    }
  }

  deselect(): void {
    this.selected = false;
    if (this.parent) {
      this.parent.childDeselected();
    }
  }

  uniqueId(): string {
    return !!this.parent ? `${this.parent.uniqueId()}.${this.id}` : this.id;
  }

  getAllFields(): Field[] {
    return [this];
  }
}
