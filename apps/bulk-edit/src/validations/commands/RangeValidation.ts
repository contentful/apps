import { BaseValidationCommand } from '../ValidationCommand';
import { ValidationError } from '../types';

interface RangeParams {
  min?: number;
  max?: number;
}

export class RangeValidation extends BaseValidationCommand {
  readonly name = 'range';
  private readonly min?: number;
  private readonly max?: number;

  constructor(params: RangeParams, customMessage?: string) {
    super(params, customMessage);
    this.min = params.min;
    this.max = params.max;
  }

  validate(value: any): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numValue = typeof value === 'number' ? value : parseFloat(value);

    if (this.min !== undefined && numValue < this.min) {
      const message =
        this.max !== undefined
          ? `Must be between ${this.min} and ${this.max}`
          : `Must be at least ${this.min}`;
      return this.createError(message, value);
    }

    if (this.max !== undefined && numValue > this.max) {
      const message =
        this.min !== undefined
          ? `Must be between ${this.min} and ${this.max}`
          : `Must be at most ${this.max}`;
      return this.createError(message, value);
    }

    return null;
  }
}
