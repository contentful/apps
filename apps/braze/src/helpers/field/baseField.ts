import { FieldType } from '@contentful/app-sdk';

export abstract class BaseField {
  constructor(public id: string) {}

  abstract toLiquidTag(contentTypeId: string, responseData: string): string[];
}

export class BasicField extends BaseField {
  constructor(id: string, public type: Exclude<FieldType, 'Array' | 'Link'>) {
    super(id);
  }

  toLiquidTag(contentTypeId: string, responseData: string): string[] {
    return [`{{${responseData}.${contentTypeId}.${this.id}}}`];
  }
}
