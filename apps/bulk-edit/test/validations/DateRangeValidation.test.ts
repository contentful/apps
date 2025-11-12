import { describe, it, expect } from 'vitest';
import { DateRangeValidation } from '../../src/validations/commands/DateRangeValidation';

describe('DateRangeValidation', () => {
  it('should pass validation for date within range', () => {
    const validation = new DateRangeValidation({
      min: '2024-01-01',
      max: '2024-12-31',
    });
    const result = validation.validate('2024-06-15');
    expect(result).toBeNull();
  });

  it('should fail validation for date before minimum', () => {
    const validation = new DateRangeValidation({
      min: '2024-01-01',
      max: '2024-12-31',
    });
    const result = validation.validate('2023-12-31');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('Must be between');
  });

  it('should fail validation for date after maximum', () => {
    const validation = new DateRangeValidation({
      min: '2024-01-01',
      max: '2024-12-31',
    });
    const result = validation.validate('2025-01-01');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('Must be between');
  });

  it('should pass validation for date equal to minimum', () => {
    const validation = new DateRangeValidation({
      min: '2024-01-01',
      max: '2024-12-31',
    });
    expect(validation.validate('2024-01-01')).toBeNull();
  });

  it('should pass validation for date equal to maximum', () => {
    const validation = new DateRangeValidation({
      min: '2024-01-01',
      max: '2024-12-31',
    });
    expect(validation.validate('2024-12-31')).toBeNull();
  });

  it('should validate with only minimum date', () => {
    const validation = new DateRangeValidation({ min: '2024-01-01' });
    expect(validation.validate('2024-06-15')).toBeNull();
    expect(validation.validate('2023-12-31')).not.toBeNull();
  });

  it('should validate with only maximum date', () => {
    const validation = new DateRangeValidation({ max: '2024-12-31' });
    expect(validation.validate('2024-06-15')).toBeNull();
    expect(validation.validate('2025-01-01')).not.toBeNull();
  });

  it('should pass validation for empty value', () => {
    const validation = new DateRangeValidation({ min: '2024-01-01' });
    expect(validation.validate('')).toBeNull();
    expect(validation.validate(null)).toBeNull();
    expect(validation.validate(undefined)).toBeNull();
  });

  it('should handle ISO date strings', () => {
    const validation = new DateRangeValidation({
      min: '2024-01-01T00:00:00Z',
      max: '2024-12-31T23:59:59Z',
    });
    expect(validation.validate('2024-06-15T12:00:00Z')).toBeNull();
  });

  it('should use custom message if provided', () => {
    const validation = new DateRangeValidation(
      { min: '2024-01-01' },
      'Date must be in 2024 or later'
    );
    const result = validation.validate('2023-12-31');
    expect(result?.message).toBe('Date must be in 2024 or later');
  });
});
