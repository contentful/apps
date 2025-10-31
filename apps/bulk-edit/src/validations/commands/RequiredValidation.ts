import { BaseValidationCommand } from '../ValidationCommand';
import { ValidationError } from '../types';

export class RequiredValidation extends BaseValidationCommand {
  readonly name = 'required';

  constructor(customMessage?: string) {
    super({}, customMessage);
  }

  validate(value: any): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return this.createError('Required', value);
    }

    if (Array.isArray(value) && value.length === 0) {
      return this.createError('Required', value);
    }

    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      return this.createError('Required', value);
    }

    return null;
  }
}
