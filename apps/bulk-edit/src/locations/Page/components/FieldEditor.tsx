import React, { useMemo } from 'react';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { MultipleLineEditor } from '@contentful/field-editor-multiple-line';
import { NumberEditor } from '@contentful/field-editor-number';
import type { FieldAPI, LocalesAPI } from '@contentful/field-editor-shared';
import type { ContentTypeField } from '../types';
import { TextInput } from '@contentful/f36-components';
import { isInvalid, isNumber } from './BulkEditModal';

/**
 * FieldEditor component that renders the appropriate Contentful field editor
 * based on the field type:
 * - SingleLineEditor for Symbol fields (Short text)
 * - MultipleLineEditor for Text fields (Long text)
 * - NumberEditor for Number and Integer fields
 *
 * Uses FieldAPI and LocalesAPI from @contentful/field-editor-shared
 * to provide the proper interface that the field editors expect.
 */

interface FieldEditorProps {
  field: ContentTypeField;
  value: string;
  onChange: (value: string) => void;
  defaultLocale: string;
}

const createFieldAPI = (
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
      onChange(String(newValue));
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

const createLocalesAPI = (defaultLocale: string): LocalesAPI => ({
  default: defaultLocale,
  available: [defaultLocale],
  names: { [defaultLocale]: defaultLocale },
  fallbacks: {},
  optional: { [defaultLocale]: false },
  direction: { [defaultLocale]: 'ltr' },
});

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  value,
  onChange,
  defaultLocale,
}) => {
  const fieldApi = useMemo(
    () => createFieldAPI(field, value, onChange, defaultLocale),
    [field, value, onChange, defaultLocale]
  );

  const localesApi = useMemo(() => createLocalesAPI(defaultLocale), [defaultLocale]);

  const renderEditor = () => {
    try {
      switch (field.type) {
        case 'Symbol':
          return (
            <SingleLineEditor
              isInitiallyDisabled={false}
              withCharValidation={true}
              field={fieldApi}
              locales={localesApi}
            />
          );
        case 'Text':
          return (
            <MultipleLineEditor field={fieldApi} locales={localesApi} isInitiallyDisabled={false} />
          );
        case 'Number':
        case 'Integer':
          return <NumberEditor field={fieldApi} isInitiallyDisabled={false} />;
        default:
          return (
            <SingleLineEditor
              isInitiallyDisabled={false}
              withCharValidation={true}
              field={fieldApi}
              locales={localesApi}
            />
          );
      }
    } catch (error) {
      console.error('Error rendering field editor:', error);
      return (
        <TextInput
          name="bulk-edit-value"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your new value"
          type={isNumber(field) ? 'number' : 'text'}
          isInvalid={isInvalid(field, value)}
          autoFocus
        />
      );
    }
  };

  return <div>{renderEditor()}</div>;
};
