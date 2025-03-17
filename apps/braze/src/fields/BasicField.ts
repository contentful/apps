import { Field } from './Field';

export class BasicField extends Field {
  constructor(id: string, entryContentTypeId: string, localized: boolean) {
    super(id, entryContentTypeId, localized);
  }

  generateQuery(): string {
    return this.id;
  }

  generateLiquidTagForType(template: string): string[] {
    return [`{{${template}.${this.id}}}`];
  }
}
