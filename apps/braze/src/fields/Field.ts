import { removeHypens, firstLetterToLowercase, SAVED_RESPONSE } from '../utils';

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

  generateLiquidTag(locale?: string): string[] {
    let template = `${SAVED_RESPONSE}.data.${this.entryContentTypeId}`;

    if (locale) {
      template = `${SAVED_RESPONSE}.data.${removeHypens(locale)}`;
    }
    return this.generateLiquidTagForType(template);
  }
}
