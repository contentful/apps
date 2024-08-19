import { mockContentTypes } from '../__mocks__';
import {
  getCompatibleFields,
  selectedFieldsToTargetState,
  editorInterfacesToSelectedFields,
} from './fields';

describe('getCompatibleFields', () => {
  it('should return compatible fields', () => {
    const result = getCompatibleFields(mockContentTypes);

    expect(result).toEqual({
      ct1: [{ id: 'f1', name: 'f1', type: 'Symbol' }],
      ct2: [{ id: 'f5', name: 'f5', type: 'Symbol' }],
    });
  });
});

describe('editorInterfacesToSelectedFields', () => {
  it('should return selected fields', () => {
    const editorInterfaces = [
      {
        sys: { contentType: { sys: { id: 'ct1' } } },
        controls: [
          { fieldId: 'f1', widgetNamespace: 'app', widgetId: 'widget1' },
          { fieldId: 'f2', widgetNamespace: 'app', widgetId: 'widget1' },
        ],
      },
      {
        sys: { contentType: { sys: { id: 'ct2' } } },
        controls: [
          { fieldId: 'f3', widgetNamespace: 'app', widgetId: 'widget1' },
          { fieldId: 'f4', widgetNamespace: 'app', widgetId: 'widget1' },
        ],
      },
    ];

    const result = editorInterfacesToSelectedFields(editorInterfaces, {});

    expect(result).toEqual({});
  });
});

describe('selectedFieldsToTargetState', () => {
  it('should return target state', () => {
    const selectedFields = [
      { ctId: 'ct1', fieldId: 'f1', sys: { id: 'f1' }, name: '' },
      { ctId: 'ct1', fieldId: 'f2', sys: { id: 'f2' }, name: '' },
      { ctId: 'ct2', fieldId: 'f3', sys: { id: 'f3' }, name: '' },
      { ctId: 'ct2', fieldId: 'f4', sys: { id: 'f4' }, name: '' },
    ];

    const compatibleFields = {
      ct1: {},
      ct2: {},
    };

    const result = selectedFieldsToTargetState(selectedFields, compatibleFields);

    expect(result).toEqual({
      EditorInterface: {
        f1: {},
        f2: {},
        f3: {},
        f4: {},
      },
    });
  });
});
