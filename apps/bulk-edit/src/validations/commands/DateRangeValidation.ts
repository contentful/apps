import { BaseValidationCommand } from '../ValidationCommand';
import { ValidationError } from '../types';

interface DateRangeParams {
  min?: string;
  max?: string;
}

export class DateRangeValidation extends BaseValidationCommand {
  readonly name = 'dateRange';
  private readonly min?: Date;
  private readonly max?: Date;

  constructor(params: DateRangeParams, customMessage?: string) {
    super(params, customMessage);
    this.min = params.min ? new Date(params.min) : undefined;
    this.max = params.max ? new Date(params.max) : undefined;
  }

  validate(value: any): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const dateValue = new Date(value);

    if (this.min && dateValue < this.min) {
      const message = this.max
        ? `Must be between ${this.formatDate(this.min)} and ${this.formatDate(this.max)}`
        : `Must be on or after ${this.formatDate(this.min)}`;
      return this.createError(message, value);
    }

    if (this.max && dateValue > this.max) {
      const message = this.min
        ? `Must be between ${this.formatDate(this.min)} and ${this.formatDate(this.max)}`
        : `Must be on or before ${this.formatDate(this.max)}`;
      return this.createError(message, value);
    }

    return null;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
