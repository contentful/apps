import type { ContentTypeField } from '../locations/Page/types';
import { ValidationCommand } from './ValidationCommand';
import { ValidationResult, ValidationConfig } from './types';
import {
  SizeValidation,
  RangeValidation,
  RegexpValidation,
  ProhibitRegexpValidation,
  InValidation,
  DateRangeValidation,
  RequiredValidation,
} from './commands';

export class ValidationExecutor {
  private readonly field: ContentTypeField;
  private readonly validationCommands: ValidationCommand[];

  constructor(field: ContentTypeField) {
    this.field = field;
    this.validationCommands = this.createValidationCommands();
  }

  validate(value: any): ValidationResult {
    const errors = this.validationCommands
      .map((command) => command.validate(value))
      .filter((error) => error !== null)
      .map((error) => error!);

    return {
      errors,
    };
  }

  private createValidationCommands(): ValidationCommand[] {
    const commands: ValidationCommand[] = [];

    // Add required validation if the field is marked as required
    if (this.field.required) {
      commands.push(new RequiredValidation());
    }

    // Add validations from the validations array
    if (this.field.validations && this.field.validations.length > 0) {
      for (const validationConfig of this.field.validations) {
        try {
          const command = this.createCommandFromConfig(validationConfig);
          if (command) {
            commands.push(command);
          }
        } catch (error) {
          console.warn(`Failed to create validation command for field ${this.field.id}:`, error);
        }
      }
    }

    return commands;
  }

  private createCommandFromConfig(config: ValidationConfig): ValidationCommand | null {
    const validationType = Object.keys(config).find((key) => key !== 'message');
    if (!validationType) {
      return null;
    }

    const params = config[validationType];
    const customMessage = config.message;

    switch (validationType) {
      case 'size':
        return new SizeValidation(params, customMessage);
      case 'range':
        return new RangeValidation(params, customMessage);
      case 'regexp':
        return new RegexpValidation(params, customMessage);
      case 'prohibitRegexp':
        return new ProhibitRegexpValidation(params, customMessage);
      case 'in':
        return new InValidation(params, customMessage);
      case 'dateRange':
        return new DateRangeValidation(params, customMessage);
      default:
        console.warn(`Unknown validation type: ${validationType}`);
        return null;
    }
  }
}
