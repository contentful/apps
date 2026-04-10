import { describe, expect, it, vi } from 'vitest';
import {
  createFieldAPI,
  getBooleanEditorParameters,
  getCustomBooleanLabels,
} from '../../../src/locations/Page/utils/fieldEditorUtils';

describe('FieldEditor helpers', () => {
  it('creates a FieldAPI that reads and updates the current value', async () => {
    const onChange = vi.fn();
    const fieldApi = createFieldAPI(
      {
        contentTypeId: 'test-content-type',
        id: 'title',
        uniqueId: 'title',
        name: 'Title',
        type: 'Symbol',
        locale: 'en-US',
        required: false,
        validations: [],
      },
      'hello',
      onChange,
      'en-US'
    );

    expect(fieldApi.getValue()).toBe('hello');

    await fieldApi.setValue('updated');
    expect(onChange).toHaveBeenCalledWith('updated');

    await fieldApi.removeValue();
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('returns custom boolean labels when field control settings are present', () => {
    expect(
      getCustomBooleanLabels({
        fieldId: 'isActive',
        widgetId: 'boolean',
        settings: { trueLabel: 'True', falseLabel: 'False' },
      } as any)
    ).toEqual({
      trueLabel: 'True',
      falseLabel: 'False',
    });
  });

  it('falls back to default boolean labels when settings are absent', () => {
    expect(getCustomBooleanLabels(undefined)).toEqual({
      trueLabel: 'Yes',
      falseLabel: 'No',
    });
  });

  it('builds boolean editor parameters with the provided labels', () => {
    expect(getBooleanEditorParameters('Enabled', 'Disabled')).toEqual({
      installation: {},
      instance: {
        trueLabel: 'Enabled',
        falseLabel: 'Disabled',
      },
      invocation: {},
    });
  });
});
