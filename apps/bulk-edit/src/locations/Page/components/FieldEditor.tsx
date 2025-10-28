import React, { useEffect, useMemo, useState } from 'react';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { MultipleLineEditor } from '@contentful/field-editor-multiple-line';
import { NumberEditor } from '@contentful/field-editor-number';
import { DateEditor } from '@contentful/field-editor-date';
import { TagsEditor } from '@contentful/field-editor-tags';
import { BooleanEditor } from '@contentful/field-editor-boolean';
import { JsonEditor } from '@contentful/field-editor-json';
import type { ContentTypeField } from '../types';
import { Note, Skeleton } from '@contentful/f36-components';
import { i18n } from '@lingui/core';
import {
  createFieldAPI,
  getCustomBooleanLabels,
  getBooleanEditorParameters,
} from '../utils/fieldEditorUtils';
import type { LocalesAPI } from '@contentful/field-editor-shared';

interface FieldEditorProps {
  field: ContentTypeField;
  value: string;
  onChange: (value: string) => void;
  locales: LocalesAPI;
}

const ERROR_MESSAGE = 'Failed to initialize field editor. Please try again.';
export const FieldEditor: React.FC<FieldEditorProps> = ({ field, value, onChange, locales }) => {
  const [error, setError] = useState('');
  const locale = field.locale ? field.locale : locales.default;

  // Ensure Lingui i18n is activated for editors that rely on it (e.g., JsonEditor)
  useEffect(() => {
    if (!i18n.locale) {
      try {
        const locale = field.locale ? field.locale : locales.default;
        i18n.load(locale, {});
        i18n.activate(locale);
        setError('');
      } catch (error) {
        setError(ERROR_MESSAGE);
      }
    }
  }, []);

  const fieldApi = useMemo(() => {
    return createFieldAPI(field, value, onChange, locale);
  }, [field, value, onChange, locales.default]);

  const renderEditor = () => {
    try {
      switch (field.type) {
        case 'Symbol':
          return (
            <SingleLineEditor
              isInitiallyDisabled={false}
              withCharValidation={true}
              field={fieldApi}
              locales={locales}
            />
          );
        case 'Text':
          return (
            <MultipleLineEditor field={fieldApi} locales={locales} isInitiallyDisabled={false} />
          );
        case 'Number':
        case 'Integer':
          return <NumberEditor field={fieldApi} isInitiallyDisabled={false} />;
        case 'Date':
          return <DateEditor field={fieldApi} isInitiallyDisabled={false} />;
        case 'Array':
          // Short text array: items.type === 'Symbol'
          return <TagsEditor field={fieldApi} isInitiallyDisabled={false} />;
        case 'Boolean':
          const { trueLabel, falseLabel } = getCustomBooleanLabels(field.fieldControl);

          return (
            <BooleanEditor
              field={fieldApi}
              isInitiallyDisabled={false}
              parameters={getBooleanEditorParameters(trueLabel, falseLabel)}
            />
          );

        case 'Object':
          return <JsonEditor field={fieldApi} isInitiallyDisabled={false} />;
        default:
          return <Note variant="negative">{ERROR_MESSAGE}</Note>;
      }
    } catch (error) {
      setError(ERROR_MESSAGE);
      console.error('Error: ', error);
    }
  };

  if (error) {
    return <Note variant="negative">{error}</Note>;
  }

  return <>{renderEditor()}</>;
};
