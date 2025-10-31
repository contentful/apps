import { BaseValidationCommand } from '../ValidationCommand';
import { ValidationError } from '../types';

interface RegexpParams {
  pattern: string;
  flags?: string;
}

export class RegexpValidation extends BaseValidationCommand {
  readonly name = 'regexp';
  private readonly regex: RegExp;

  constructor(params: RegexpParams, customMessage?: string) {
    super(params, customMessage);
    this.regex = new RegExp(params.pattern, params.flags || '');
  }

  validate(value: any): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value);

    if (!this.regex.test(stringValue)) {
      return this.createError(
        'Input does not match the expected format. Please edit and try again.',
        value
      );
    }

    return null;
  }
}
