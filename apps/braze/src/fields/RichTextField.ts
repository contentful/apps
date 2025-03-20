import { Field } from './Field';

// We are not supporting rich text fields for now
export class RichTextField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  generateQuery(): string {
    return '';
  }

  generateLiquidTagForType(template: string): string[] {
    return [];
  }
}
