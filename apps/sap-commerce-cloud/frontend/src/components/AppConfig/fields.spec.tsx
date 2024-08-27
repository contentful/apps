import { mockContentTypes } from '@__mocks__/mockContentTypes';
import {
  getCompatibleFields,
  selectedFieldsToTargetState,
  editorInterfacesToSelectedFields,
} from '@components/AppConfig/fields';

describe('getCompatibleFields', () => {
  it('should return compatible fields', () => {
    const result = getCompatibleFields(mockContentTypes);

    expect(result).toEqual({
      ct1: [
        { id: 'f1', name: 'f1', type: 'Symbol' },
        { id: 'f2', name: 'f2', type: 'Array', items: { type: 'Symbol' } },
      ],
      ct2: [
        { id: 'f5', name: 'f5', type: 'Symbol' },
        { id: 'f6', name: 'f6', type: 'Array', items: { type: 'Symbol' } },
      ],
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

    const result = editorInterfacesToSelectedFields(editorInterfaces, 'widget1');

    expect(result).toEqual({
      ct1: ['f1', 'f2'],
      ct2: ['f3', 'f4'],
    });
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
      ct1: ['f1', 'f2'],
      ct2: ['f3', 'f4'],
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
