import type { FieldAPI } from '@contentful/field-editor-shared';
import type { ContentTypeField } from '../types';
import { EditorInterfaceProps } from 'contentful-management';

// API creation utilities
export const createFieldAPI = (
  field: ContentTypeField,
  value: string,
  onChange: (value: string) => void,
  defaultLocale: string
): FieldAPI => {
  const locale = field.locale || defaultLocale;

  return {
    id: field.id,
    name: field.name,
    locale: locale,
    type: field.type as any,
    required: false,
    validations: [],
    getValue: () => value,
    setValue: async (newValue: any) => {
      onChange(newValue);
      return newValue;
    },
    removeValue: async () => {
      onChange('');
    },
    setInvalid: () => {},
    onValueChanged: () => () => {},
    getIsDisabled: () => false,
    onIsDisabledChanged: () => () => {},
    getSchemaErrors: () => [],
    onSchemaErrorsChanged: () => () => {},
  };
};

export const getBooleanLabels = (editorInterface: EditorInterfaceProps | null, fieldId: string) => {
  const booleanSettings = editorInterface?.controls?.find((c) => c.fieldId === fieldId)?.settings;

  return {
    trueLabel: booleanSettings?.trueLabel ? String(booleanSettings.trueLabel) : 'Yes',
    falseLabel: booleanSettings?.falseLabel ? String(booleanSettings.falseLabel) : 'No',
  };
};

export const getBooleanEditorParameters = (trueLabel: string, falseLabel: string) => {
  return {
    installation: {},
    instance: {
      trueLabel,
      falseLabel,
    },
    invocation: {},
  };
};
