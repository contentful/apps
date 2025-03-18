import { SAVED_RESPONSE } from '../utils';

export abstract class Field {
  public id: string;
  public localized: boolean;
  public entryContentTypeId: string;

  constructor(id: string, entryContentTypeId: string, localized: boolean) {
    this.id = id;
    this.entryContentTypeId = entryContentTypeId;
    this.localized = localized;
  }

  abstract generateQuery(): string;
  public abstract generateLiquidTagForType(template: string): string[];

  generateLiquidTag(locale?: string): string[] {
    let template = `${SAVED_RESPONSE}.data.${this.entryContentTypeId}`;

    if (locale) {
      const localWithoutHypens = locale?.replace('-', '') ?? '';
      template = `${SAVED_RESPONSE}.data.${localWithoutHypens}`;
    }
    return this.generateLiquidTagForType(template);
  }
}
