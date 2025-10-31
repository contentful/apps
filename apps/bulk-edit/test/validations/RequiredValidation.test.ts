import { describe, it, expect } from 'vitest';
import { RequiredValidation } from '../../src/validations/commands/RequiredValidation';

describe('RequiredValidation', () => {
  it('should fail validation for null value', () => {
    const validation = new RequiredValidation();
    const result = validation.validate(null);
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Required');
  });

  it('should fail validation for undefined value', () => {
    const validation = new RequiredValidation();
    const result = validation.validate(undefined);
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Required');
  });

  it('should fail validation for empty string', () => {
    const validation = new RequiredValidation();
    const result = validation.validate('');
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Required');
  });

  it('should fail validation for empty array', () => {
    const validation = new RequiredValidation();
    const result = validation.validate([]);
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Required');
  });

  it('should fail validation for empty object', () => {
    const validation = new RequiredValidation();
    const result = validation.validate({});
    expect(result).not.toBeNull();
    expect(result?.message).toBe('Required');
  });

  it('should pass validation for non-empty string', () => {
    const validation = new RequiredValidation();
    expect(validation.validate('hello')).toBeNull();
  });

  it('should pass validation for non-empty array', () => {
    const validation = new RequiredValidation();
    expect(validation.validate(['item'])).toBeNull();
  });

  it('should pass validation for non-empty object', () => {
    const validation = new RequiredValidation();
    expect(validation.validate({ key: 'value' })).toBeNull();
  });

  it('should pass validation for number zero', () => {
    const validation = new RequiredValidation();
    expect(validation.validate(0)).toBeNull();
  });

  it('should pass validation for boolean false', () => {
    const validation = new RequiredValidation();
    expect(validation.validate(false)).toBeNull();
  });

  it('should use custom message if provided', () => {
    const validation = new RequiredValidation('This field cannot be empty');
    const result = validation.validate('');
    expect(result?.message).toBe('This field cannot be empty');
  });
});
