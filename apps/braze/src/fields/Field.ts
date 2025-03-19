import { firstLetterToLowercase, SAVED_RESPONSE } from '../utils';

export abstract class Field {
  public id: string;
  public localized: boolean;
  public entryContentTypeId: string;

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
}
