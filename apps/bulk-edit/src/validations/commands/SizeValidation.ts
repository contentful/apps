import { BaseValidationCommand } from '../ValidationCommand';
import { ValidationError } from '../types';

interface SizeParams {
  min?: number;
  max?: number;
}

export class SizeValidation extends BaseValidationCommand {
  readonly name = 'size';
  private readonly min?: number;
  private readonly max?: number;

  constructor(params: SizeParams, customMessage?: string) {
    super(params, customMessage);
    this.min = params.min;
    this.max = params.max;
  }

  validate(value: any): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    let length: number;

    if (typeof value === 'string') {
      length = value.length;
    } else if (Array.isArray(value)) {
      length = value.length;
    } else if (typeof value === 'object') {
      length = Object.keys(value).length;
    } else {
      return null;
    }

    if (this.min !== undefined && length < this.min) {
      const message =
        this.max !== undefined
          ? `Length must be between ${this.min} and ${this.max}`
          : `Length must be at least ${this.min}`;
      return this.createError(message, value);
    }

    if (this.max !== undefined && length > this.max) {
      const message =
        this.min !== undefined
          ? `Length must be between ${this.min} and ${this.max}`
          : `Length must be at most ${this.max}`;
      return this.createError(message, value);
    }

    return null;
  }
}
