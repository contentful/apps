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
      required: false,
      validations: [{ size: { min: 5, max: 100 } }],
    };

    const executor = new ValidationExecutor(field);

    expect(executor.validate('Hello World').errors.length).toBe(0);
    expect(executor.validate('Hi').errors.length).toBe(1);
  });

  it('should validate number field with range constraint', () => {
    const field: ContentTypeField = {
      contentTypeId: 'test',
      id: 'age',
      uniqueId: 'age',
      name: 'Age',
      type: 'Integer',
      required: false,
      validations: [{ range: { min: 0, max: 120 } }],
    };

    const executor = new ValidationExecutor(field);

    expect(executor.validate(25).errors.length).toBe(0);
    expect(executor.validate(-5).errors.length).toBe(1);
    expect(executor.validate(150).errors.length).toBe(1);
  });

  it('should validate with multiple validations', () => {
    const field: ContentTypeField = {
      contentTypeId: 'test',
      id: 'code',
      uniqueId: 'code',
      name: 'Code',
      type: 'Symbol',
      required: false,
      validations: [{ size: { min: 3, max: 10 } }, { regexp: { pattern: '^[A-Z]' } }],
    };

    const executor = new ValidationExecutor(field);

    expect(executor.validate('ABC').errors.length).toBe(0);
    expect(executor.validate('ab').errors.length).toBe(2); // too short and doesn't match pattern
    expect(executor.validate('abc').errors.length).toBe(1); // doesn't match pattern
  });

  it('should return no errors for field without validations', () => {
    const field: ContentTypeField = {
      contentTypeId: 'test',
      id: 'description',
      uniqueId: 'description',
      name: 'Description',
      type: 'Text',
      required: false,
      validations: [],
    };

    const executor = new ValidationExecutor(field);

    expect(executor.validate('any value').errors.length).toBe(0);
  });

  it('should validate array field with items validations', () => {
    const field: ContentTypeField = {
      contentTypeId: 'test',
      id: 'items',
      uniqueId: 'items',
      name: 'Items',
      type: 'Array',
      required: false,
      items: {
        type: 'Symbol',
        validations: [{ size: { min: 5, max: 100 } }],
      },
      validations: [],
    };

    const executor = new ValidationExecutor(field);

    expect(executor.validate(['Hello World', 'Hello']).errors.length).toBe(0);
    expect(executor.validate(['Hello', 'Hi']).errors.length).toBe(1);
  });
});
