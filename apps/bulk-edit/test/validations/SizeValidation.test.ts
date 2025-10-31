import { describe, it, expect } from 'vitest';
import { SizeValidation } from '../../src/validations/commands/SizeValidation';

describe('SizeValidation', () => {
  it('should pass validation for value within range', () => {
    const validation = new SizeValidation({ min: 5, max: 10 });
    const result = validation.validate('hello!');
    expect(result).toBeNull();
  });

  it('should fail validation for value below minimum', () => {
    const validation = new SizeValidation({ min: 5, max: 10 });
    const result = validation.validate('hi');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('between 5 and 10');
  });

  it('should fail validation for value above maximum', () => {
    const validation = new SizeValidation({ min: 5, max: 10 });
    const result = validation.validate('this is way too long');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('between 5 and 10');
  });

  it('should pass validation for empty value', () => {
    const validation = new SizeValidation({ min: 5 });
    expect(validation.validate('')).toBeNull();
    expect(validation.validate(null)).toBeNull();
    expect(validation.validate(undefined)).toBeNull();
  });

  it('should validate array length', () => {
    const validation = new SizeValidation({ min: 2, max: 4 });
    expect(validation.validate(['a', 'b', 'c'])).toBeNull();
    expect(validation.validate(['a'])).not.toBeNull();
    expect(validation.validate(['a', 'b', 'c', 'd', 'e'])).not.toBeNull();
  });
});
