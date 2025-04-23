import { Field } from './Field';

export class TextArrayField extends Field {
  constructor(id: string, name: string, entryContentTypeId: string, localized: boolean) {
    super(id, name, entryContentTypeId, localized);
  }

  generateQuery(): string {
    return this.id;
  }

  generateLiquidTagForType(template: string): string[] {
    return [
      `{% for ${this.id}Item in ${template}.${this.id} %}
  {{${this.id}Item}}
{% endfor %}`,
    ];
  }
}
