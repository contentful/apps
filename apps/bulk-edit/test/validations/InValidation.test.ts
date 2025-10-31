import { describe, it, expect } from 'vitest';
import { InValidation } from '../../src/validations/commands/InValidation';

describe('InValidation', () => {
  it('should pass validation for allowed value', () => {
    const validation = new InValidation(['red', 'green', 'blue']);
    expect(validation.validate('red')).toBeNull();
  });

  it('should fail validation for disallowed value', () => {
    const validation = new InValidation(['red', 'green', 'blue']);
    const result = validation.validate('yellow');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('Must be one of');
  });

  it('should pass validation for empty value', () => {
    const validation = new InValidation(['option1', 'option2']);
    expect(validation.validate('')).toBeNull();
  });

  it('should validate numeric values', () => {
    const validation = new InValidation([1, 2, 3]);
    expect(validation.validate(2)).toBeNull();
    expect(validation.validate(5)).not.toBeNull();
  });
});
