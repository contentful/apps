import { describe, it, expect } from 'vitest';
import { ValidationExecutor } from '../../src/validations/ValidationExecutor';
import type { ContentTypeField } from '../../src/locations/Page/types';

describe('ValidationExecutor', () => {
  it('should validate text field with size constraint', () => {
    const field: ContentTypeField = {
      contentTypeId: 'test',
      id: 'title',
      uniqueId: 'title',
      name: 'Title',
      type: 'Symbol',
      validations: [{ size: { min: 5, max: 100 } }],
    };

    const executor = new ValidationExecutor(field);

    expect(executor.validate('Hello World').isValid).toBe(true);
    expect(executor.validate('Hi').isValid).toBe(false);
  });

  it('should validate number field with range constraint', () => {
    const field: ContentTypeField = {
      contentTypeId: 'test',
      id: 'age',
      uniqueId: 'age',
      name: 'Age',
      type: 'Integer',
      validations: [{ range: { min: 0, max: 120 } }],
    };

    const executor = new ValidationExecutor(field);

    expect(executor.validate(25).isValid).toBe(true);
    expect(executor.validate(-5).isValid).toBe(false);
    expect(executor.validate(150).isValid).toBe(false);
  });

  it('should validate with multiple validations', () => {
    const field: ContentTypeField = {
      contentTypeId: 'test',
      id: 'code',
      uniqueId: 'code',
      name: 'Code',
      type: 'Symbol',
      validations: [{ size: { min: 3, max: 10 } }, { regexp: { pattern: '^[A-Z]' } }],
    };

    const executor = new ValidationExecutor(field);

    expect(executor.validate('ABC').isValid).toBe(true);
    expect(executor.validate('ab').isValid).toBe(false); // too short and doesn't match pattern
    expect(executor.validate('abc').isValid).toBe(false); // doesn't match pattern
  });

  it('should return no errors for field without validations', () => {
    const field: ContentTypeField = {
      contentTypeId: 'test',
      id: 'description',
      uniqueId: 'description',
      name: 'Description',
      type: 'Text',
      validations: [],
    };

    const executor = new ValidationExecutor(field);

    expect(executor.validate('any value').isValid).toBe(true);
  });
});
