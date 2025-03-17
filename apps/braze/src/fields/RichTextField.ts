import { Field } from './Field';

export class RichTextField extends Field {
  constructor(id: string, entryContentTypeId: string, localized: boolean) {
    super(id, entryContentTypeId, localized);
  }

  generateQuery(): string {
    return '';
  }

  generateLiquidTagForType(template: string): string[] {
    return [];
  }
}
