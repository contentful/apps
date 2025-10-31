import { describe, it, expect } from 'vitest';
import { RangeValidation } from '../../src/validations/commands/RangeValidation';

describe('RangeValidation', () => {
  it('should pass validation for value within range', () => {
    const validation = new RangeValidation({ min: 0, max: 100 });
    expect(validation.validate(50)).toBeNull();
  });

  it('should fail validation for value below minimum', () => {
    const validation = new RangeValidation({ min: 10, max: 100 });
    const result = validation.validate(5);
    expect(result).not.toBeNull();
    expect(result?.message).toContain('between 10 and 100');
  });

  it('should fail validation for value above maximum', () => {
    const validation = new RangeValidation({ min: 0, max: 100 });
    const result = validation.validate(150);
    expect(result).not.toBeNull();
    expect(result?.message).toContain('between 0 and 100');
  });

  it('should pass validation for empty value', () => {
    const validation = new RangeValidation({ min: 0 });
    expect(validation.validate('')).toBeNull();
    expect(validation.validate(null)).toBeNull();
  });

  it('should handle string numbers', () => {
    const validation = new RangeValidation({ min: 0, max: 100 });
    expect(validation.validate('50')).toBeNull();
    expect(validation.validate('150')).not.toBeNull();
  });
});
