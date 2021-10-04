import { ContentType, EditorInterface, Field, PickerMode } from './../interfaces';
import get from 'lodash/get';
import set from 'lodash/set';

export type CompatibleFields = Record<string, Field[]>;
export type FieldsConfig = Record<string, Record<string, PickerMode | undefined> | undefined>;

function isCompatibleField(field: Field): boolean {
  return field.type === 'Symbol'
         || (field.type === 'Array' && field.items!.type === 'Symbol');
}

export function getCompatibleFields(contentTypes: ContentType[]): CompatibleFields {
  return contentTypes.reduce((acc, ct) => {
    return {
      ...acc,
      [ct.sys.id]: (ct.fields || []).filter(isCompatibleField)
    };
  }, {});
}

export function editorInterfacesToSelectedFields(
  eis: EditorInterface[],
  fieldsConfig: FieldsConfig,
  appId?: string
): FieldsConfig {
  return eis.reduce((acc, ei) => {
    const ctId = get(ei, ['sys', 'contentType', 'sys', 'id']);
    const fieldIds = get(ei, ['controls'], [])
      .filter(control => control.widgetNamespace === 'app' && control.widgetId === appId)
      .map(control => control.fieldId)
      .filter(fieldId => typeof fieldId === 'string' && fieldId.length > 0);

    if (ctId && fieldIds.length > 0) {
      const fields = fieldIds.reduce((acc, fieldId) => {
        const type = get(fieldsConfig, [ctId, fieldId], 'product');
        set(acc, [fieldId], type);
        return acc;
      }, {});
      return { ...acc, [ctId]: fields };
    } else {
      return acc;
    }
  }, {});
}

export function selectedFieldsToTargetState(
  contentTypes: ContentType[],
  selectedFields: FieldsConfig
) {
  return {
    EditorInterface: contentTypes.reduce((acc, ct) => {
      const { id } = ct.sys;
      const fields = Object.keys(selectedFields[id] || {});
      const targetState =
        fields.length > 0 ? { controls: fields.map(fieldId => ({ fieldId })) } : {};

      return { ...acc, [id]: targetState };
    }, {})
  };
}
