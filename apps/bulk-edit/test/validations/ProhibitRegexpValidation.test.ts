import { describe, it, expect } from 'vitest';
import { ProhibitRegexpValidation } from '../../src/validations/commands/ProhibitRegexpValidation';

describe('ProhibitRegexpValidation', () => {
  it('should pass validation when value does not match prohibited pattern', () => {
    const validation = new ProhibitRegexpValidation({ pattern: '\\d+' });
    expect(validation.validate('hello')).toBeNull();
  });

  it('should fail validation when value matches prohibited pattern', () => {
    const validation = new ProhibitRegexpValidation({ pattern: '\\d+' });
    const result = validation.validate('hello123');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('does not match the expected format');
  });

  it('should support regex flags', () => {
    const validation = new ProhibitRegexpValidation({
      pattern: 'test',
      flags: 'i',
    });
    expect(validation.validate('hello')).toBeNull();
    expect(validation.validate('TEST')).not.toBeNull();
    expect(validation.validate('Test')).not.toBeNull();
  });

  it('should pass validation for empty value', () => {
    const validation = new ProhibitRegexpValidation({ pattern: '\\d+' });
    expect(validation.validate('')).toBeNull();
    expect(validation.validate(null)).toBeNull();
    expect(validation.validate(undefined)).toBeNull();
  });

  it('should handle special regex characters', () => {
    const validation = new ProhibitRegexpValidation({ pattern: '[0-9]' });
    expect(validation.validate('abc')).toBeNull();
    expect(validation.validate('abc1')).not.toBeNull();
  });

  it('should prohibit email pattern', () => {
    const validation = new ProhibitRegexpValidation({
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
    });
    expect(validation.validate('just-text')).toBeNull();
    expect(validation.validate('user@example.com')).not.toBeNull();
  });

  it('should prohibit URL pattern', () => {
    const validation = new ProhibitRegexpValidation({
      pattern: '^https?://',
    });
    expect(validation.validate('just text')).toBeNull();
    expect(validation.validate('http://example.com')).not.toBeNull();
    expect(validation.validate('https://example.com')).not.toBeNull();
  });

  it('should use custom message if provided', () => {
    const validation = new ProhibitRegexpValidation(
      { pattern: '\\d+' },
      'Numbers are not allowed in this field'
    );
    const result = validation.validate('test123');
    expect(result?.message).toBe('Numbers are not allowed in this field');
  });

  it('should throw error for invalid regex pattern', () => {
    expect(() => {
      new ProhibitRegexpValidation({ pattern: '[invalid(' });
    }).toThrow('Invalid regular expression');
  });
});
