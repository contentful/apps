import { ReferenceArrayField } from './ReferenceArrayField';
import { ReferenceField } from './ReferenceField';
import { ReferenceItem } from './ReferenceItem';
import { removeHypens, firstLetterToLowercase, SAVED_RESPONSE } from '../utils';

export abstract class Field {
  public id: string;
  public name: string;
  public localized: boolean;
  public entryContentTypeId: string;
  public selected: boolean = false;
  public parent: ReferenceField | ReferenceArrayField | ReferenceItem | null = null;

  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    this.id = firstLetterToLowercase(id);
    this.name = name;
    this.entryContentTypeId = firstLetterToLowercase(entryContentTypeId);
    this.localized = localized;
  }

  abstract generateQuery(): string;
  public abstract generateLiquidTagForType(template: string): string[];

  generateLiquidTag(locale?: string): string[] {
    let template = `${SAVED_RESPONSE}.data.${this.entryContentTypeId}`;

    if (locale) {
      template = `${SAVED_RESPONSE}.data.${removeHypens(locale)}`;
    }
    return this.generateLiquidTagForType(template);
  }

  displayName(): string {
    return this.name;
  }

  toggle(selected: boolean) {
    this.selected = selected;
    if (this.parent) {
      this.parent.childToggled(selected);
    }
  }

  uniqueId(): string {
    return !!this.parent ? `${this.parent.uniqueId()}.${this.id}` : this.id;
  }

  getAllFields(): Field[] {
    return [this];
  }
}
