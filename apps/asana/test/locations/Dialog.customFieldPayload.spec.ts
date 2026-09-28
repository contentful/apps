import { describe, expect, it } from 'vitest';
import { buildCustomFieldValuePayload } from '../../src/locations/Dialog';
import type { AsanaCustomFieldValue } from '../../src/types';

const baseField = (overrides: Partial<AsanaCustomFieldValue>): AsanaCustomFieldValue => ({
  gid: 'field-1',
  name: 'Field',
  type: 'number',
  ...overrides,
});

describe('buildCustomFieldValuePayload', () => {
  it('rounds a number value to the field precision before sending', () => {
    const payload = buildCustomFieldValuePayload(baseField({ numberValue: 100, precision: 2 }));

    expect(payload).toBe(JSON.stringify(100));
  });

  it('rounds a value with more decimals than the configured precision', () => {
    const payload = buildCustomFieldValuePayload(baseField({ numberValue: 10.567, precision: 2 }));

    expect(payload).toBe(JSON.stringify(10.57));
  });

  it('leaves the number unrounded when precision is unknown', () => {
    const payload = buildCustomFieldValuePayload(baseField({ numberValue: 10.567 }));

    expect(payload).toBe(JSON.stringify(10.567));
  });

  it('sends null when the number value is cleared', () => {
    const payload = buildCustomFieldValuePayload(baseField({ numberValue: undefined }));

    expect(payload).toBe(JSON.stringify(null));
  });

  it('trims and JSON-encodes text values', () => {
    const payload = buildCustomFieldValuePayload(
      baseField({ type: 'text', textValue: '  hello  ' })
    );

    expect(payload).toBe(JSON.stringify('hello'));
  });

  it('sends null instead of an empty string when a text value is cleared', () => {
    const payload = buildCustomFieldValuePayload(baseField({ type: 'text', textValue: '   ' }));

    expect(payload).toBe(JSON.stringify(null));
  });

  it('sends null when a text value was never set', () => {
    const payload = buildCustomFieldValuePayload(baseField({ type: 'text', textValue: undefined }));

    expect(payload).toBe(JSON.stringify(null));
  });
});
