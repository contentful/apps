import { ValidationError } from './types';

export interface ValidationCommand {
  readonly name: string;
  validate(value: any): ValidationError | null;
}

export abstract class BaseValidationCommand implements ValidationCommand {
  abstract readonly name: string;
  protected readonly params: Record<string, any>;
  protected readonly customMessage?: string;

  constructor(params: Record<string, any>, customMessage?: string) {
    this.params = params;
    this.customMessage = customMessage;
  }

  abstract validate(value: any): ValidationError | null;

  protected createError(defaultMessage: string, value?: any): ValidationError {
    return {
      name: this.name,
      message: this.customMessage || defaultMessage,
      value,
      params: this.params,
    };
  }
}
