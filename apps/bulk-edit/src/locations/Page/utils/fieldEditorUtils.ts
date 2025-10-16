import type { LocalesAPI } from '@contentful/field-editor-shared';
import type { ContentTypeField } from '../types';

// API creation utilities
export const createFieldAPI = (
  field: ContentTypeField,
  value: string,
  onChange: (value: string) => void,
  defaultLocale: string
) => {
  const locale = field.locale || defaultLocale;

  return {
    id: field.id,
    name: field.name,
    locale: locale,
    type: field.type,
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
