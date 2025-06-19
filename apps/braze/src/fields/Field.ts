import { removeHypens, firstLetterToLowercase, SAVED_RESPONSE } from '../utils';

export abstract class Field {
  public id: string;
  public name: string;
  public localized: boolean;
  public entryContentTypeId: string;
  private _selected: boolean = false;
  public parent: Field | null = null;

  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    this.id = firstLetterToLowercase(id);
    this.name = name;
    this.entryContentTypeId = firstLetterToLowercase(entryContentTypeId);
    this.localized = localized;
  }

  public get selected(): boolean {
    return this._selected;
  }

  public set selected(value: boolean) {
    this._selected = value;
  }

  abstract generateQuery(): string;
  public abstract generateLiquidTagForType(template: string): string[];
  abstract get type(): string;

  serialize(): any {
    return {
      id: this.id,
      name: this.name,
      entryContentTypeId: this.entryContentTypeId,
      localized: this.localized,
      selected: this.selected,
      type: this.type,
    };
  }

  generateLiquidTag(locale?: string): string[] {
    let template = `${SAVED_RESPONSE}.data.${this.entryContentTypeId}`;

    if (locale) {
      template = `${SAVED_RESPONSE}.data.${removeHypens(locale)}`;
    }
    return this.generateLiquidTagForType(template);
  }

  displayNameForGenerate(): string {
    return this.name;
  }

  displayNameForCreate(): string {
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

  getChildren(): Field[] {
    return [];
  }

  childToggled(selected: boolean) {}

  isEnabledForGenerate(): boolean {
    return true;
  }

  isEnabledForCreate(): boolean {
    return true;
  }
}
