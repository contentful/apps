import React, { useMemo, useState } from 'react';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { MultipleLineEditor } from '@contentful/field-editor-multiple-line';
import { NumberEditor } from '@contentful/field-editor-number';
import { DateEditor } from '@contentful/field-editor-date';
import { TagsEditor } from '@contentful/field-editor-tags';
import { BooleanEditor } from '@contentful/field-editor-boolean';
import { JsonEditor } from '@contentful/field-editor-json';
import { DropdownEditor } from '@contentful/field-editor-dropdown';
import { RadioEditor } from '@contentful/field-editor-radio';
import { ListEditor } from '@contentful/field-editor-list';
import { CheckboxEditor } from '@contentful/field-editor-checkbox';
import type { ContentTypeField } from '../types';
import { Note } from '@contentful/f36-components';
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

  const fieldApi = useMemo(() => {
    return createFieldAPI(field, value, onChange, locale);
  }, [field, value, onChange, locale]);

  const renderEditor = () => {
    try {
      switch (field.fieldControl?.widgetId) {
        case 'singleLine':
          return (
            <SingleLineEditor
              isInitiallyDisabled={false}
              withCharValidation={true}
              field={fieldApi}
              locales={locales}
            />
          );
        case 'dropdown':
          return (
            <DropdownEditor
              isInitiallyDisabled={false}
              field={fieldApi}
              locales={locales}></DropdownEditor>
          );
        case 'radio':
          return (
            <RadioEditor
              isInitiallyDisabled={false}
              field={fieldApi}
              locales={locales}></RadioEditor>
          );
        case 'multipleLine':
          return (
            <MultipleLineEditor field={fieldApi} locales={locales} isInitiallyDisabled={false} />
          );
        case 'numberEditor':
          return <NumberEditor field={fieldApi} isInitiallyDisabled={false} />;
        case 'datePicker':
          return <DateEditor field={fieldApi} isInitiallyDisabled={false} />;
        case 'listInput':
          return (
            <ListEditor field={fieldApi} locales={locales} isInitiallyDisabled={false}></ListEditor>
          );
        case 'checkbox':
          return (
            <CheckboxEditor
              field={fieldApi}
              locales={locales}
              isInitiallyDisabled={false}></CheckboxEditor>
          );
        case 'tagEditor':
          return <TagsEditor field={fieldApi} isInitiallyDisabled={false} />;
        case 'boolean':
          const { trueLabel, falseLabel } = getCustomBooleanLabels(field.fieldControl);

          return (
            <BooleanEditor
              field={fieldApi}
              isInitiallyDisabled={false}
              parameters={getBooleanEditorParameters(trueLabel, falseLabel)}
            />
          );

        case 'objectEditor':
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
