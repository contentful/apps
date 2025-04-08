import { Field } from './Field';

// We are not supporting rich text fields for now
export class RichTextField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  generateQuery(): string {
    throw new Error('Rich text not supported');
  }

  generateLiquidTagForType(template: string): string[] {
    throw new Error('Rich text not supported');
  }

  isEnabled(): boolean {
    return false;
  }

  displayName(): string {
    return `${this.name} (Support for rich text fields coming soon)`;
  }
}
