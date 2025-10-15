import type { FieldAPI } from '@contentful/field-editor-shared';
import type { ContentTypeField } from '../types';

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

export const createLocalesAPI = (defaultLocale: string): LocalesAPI => ({
  default: defaultLocale,
  available: [defaultLocale],
  names: { [defaultLocale]: defaultLocale },
  fallbacks: {},
  optional: { [defaultLocale]: false },
  direction: { [defaultLocale]: 'ltr' },
});

// Convert editor output back to string format
const convertValueToString = (fieldType: string, newValue: any): string => {
  switch (fieldType) {
    case 'Array':
      return Array.isArray(newValue) ? newValue.join(', ') : String(newValue);
    case 'Boolean':
      return String(newValue);
    case 'Object':
      return typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
    default:
      return String(newValue);
  }
};
