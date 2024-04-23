import { describe, expect, it } from 'vitest';
import { validateApiPathData } from './validateApiPathData';
import { ApiPath } from '@customTypes/configPage';

describe('validateApiPathData', () => {
  it('should validate correct data', () => {
    const result = validateApiPathData([{ id: '1', name: 'test' }]);

    expect(result).toBe(true);
  });

  it('should invalidate data that is not an array', () => {
    const result = validateApiPathData({ id: '1', name: 'test' } as unknown as ApiPath[]);

    expect(result).toBe(false);
  });

  it('should invalidate data that is an empty array', () => {
    const result = validateApiPathData([]);

    expect(result).toBe(false);
  });
});
