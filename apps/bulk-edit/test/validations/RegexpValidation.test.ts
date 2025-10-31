import { describe, it, expect } from 'vitest';
import { RegexpValidation } from '../../src/validations/commands/RegexpValidation';

describe('RegexpValidation', () => {
  it('should pass validation for matching pattern', () => {
    const validation = new RegexpValidation({ pattern: '^[A-Z]' });
    expect(validation.validate('Hello')).toBeNull();
  });

  it('should fail validation for non-matching pattern', () => {
    const validation = new RegexpValidation({ pattern: '^[A-Z]' });
    const result = validation.validate('hello');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('does not match the expected format');
  });

  it('should support regex flags', () => {
    const validation = new RegexpValidation({ pattern: '^hello', flags: 'i' });
    expect(validation.validate('Hello')).toBeNull();
    expect(validation.validate('HELLO')).toBeNull();
  });

  it('should pass validation for empty value', () => {
    const validation = new RegexpValidation({ pattern: '^[A-Z]' });
    expect(validation.validate('')).toBeNull();
  });
});
