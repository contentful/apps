type ErrorMessage = string | undefined;
type FieldId = string;
export type ErrorField = Record<FieldId, ErrorMessage>;

export class Validator {
  static setError(errors: ErrorField, field: string, message: string): void {
    errors[field] = message;
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
    const isEmpty =
        value == null ||
        (typeof value === 'string' && value.trim() === '') ||
        (value instanceof Date && Number.isNaN(value.getTime()));

    if (!isEmpty) return;

    const errorMessage = `${label} is required`;
    this.setError(errors, field, errorMessage);
    return errorMessage;
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

    return;
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

    return;
  }
}
