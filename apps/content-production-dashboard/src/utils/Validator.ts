export class Validator {
  static setError(
    errors: Record<string, string>,
    field: string,
    message: string | undefined
  ): void {
    if (message === undefined || message.trim() === '') {
      delete errors[field];
    } else {
      errors[field] = message;
    }
  }

  static getError(errors: Record<string, string>, field: string): string | undefined {
    return errors[field];
  }

  static clearError(errors: Record<string, string>, field: string): void {
    delete errors[field];
  }

  static clearAll(errors: Record<string, string>): void {
    Object.keys(errors).forEach((key) => delete errors[key]);
  }

  static hasErrors(errors: Record<string, string>): boolean {
    return Object.keys(errors).length > 0;
  }

  static isRequired(
    errors: Record<string, string>,
    value: Date | string | number | undefined,
    field: string,
    label: string
  ): string | undefined {
    let isEmpty = false;

    if (value === undefined || value === null) {
      isEmpty = true;
    } else if (typeof value === 'string' && value.trim() === '') {
      isEmpty = true;
    } else if (value instanceof Date && isNaN(value.getTime())) {
      isEmpty = true;
    }

    if (isEmpty) {
      const errorMessage = `${label} is required`;
      this.setError(errors, field, errorMessage);
      return errorMessage;
    }

    this.clearError(errors, field);
    return undefined;
  }

  static isWithinRange(
    errors: Record<string, string>,
    value: number | undefined,
    field: string,
    label: string,
    range: { min: number; max: number }
  ): string | undefined {
    if (value === undefined) {
      const errorMessage = `${label} is required`;
      this.setError(errors, field, errorMessage);
      return errorMessage;
    }

    if (value < range.min || value > range.max) {
      const errorMessage = `${label} must be between ${range.min} and ${range.max}`;
      this.setError(errors, field, errorMessage);
      return errorMessage;
    }

    this.clearError(errors, field);
    return undefined;
  }

  static customValidation(
    errors: Record<string, string>,
    condition: () => boolean,
    field: string,
    errorMessage: string
  ): string | undefined {
    if (!condition()) {
      this.setError(errors, field, errorMessage);
      return errorMessage;
    }

    this.clearError(errors, field);
    return undefined;
  }
}
