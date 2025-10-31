import { BaseValidationCommand } from '../ValidationCommand';
import { ValidationError } from '../types';

export class InValidation extends BaseValidationCommand {
  readonly name = 'in';
  private readonly allowedValues: any[];

  constructor(allowedValues: any[], customMessage?: string) {
    super({ allowedValues }, customMessage);
    this.allowedValues = allowedValues;
  }

  validate(value: any): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Check if value is in the allowed values using deep equality
    const isAllowed = this.allowedValues.some((allowedValue) => {
      if (typeof allowedValue === 'object' && allowedValue !== null) {
        return JSON.stringify(allowedValue) === JSON.stringify(value);
      }
      return allowedValue === value;
    });

    if (!isAllowed) {
      const allowedValuesStr = this.allowedValues
        .map((v) => (typeof v === 'string' ? `"${v}"` : String(v)))
        .join(', ');
      return this.createError(`Must be one of: ${allowedValuesStr}`, value);
    }

    return null;
  }
}
