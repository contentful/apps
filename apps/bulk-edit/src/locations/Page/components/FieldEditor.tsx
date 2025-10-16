import React, { useEffect, useMemo } from 'react';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { MultipleLineEditor } from '@contentful/field-editor-multiple-line';
import { NumberEditor } from '@contentful/field-editor-number';
import { DateEditor } from '@contentful/field-editor-date';
import { TagsEditor } from '@contentful/field-editor-tags';
import { BooleanEditor } from '@contentful/field-editor-boolean';
import { JsonEditor } from '@contentful/field-editor-json';
import type { ContentTypeField } from '../types';
import { TextInput } from '@contentful/f36-components';
import { i18n } from '@lingui/core';
import { createFieldAPI, createLocalesAPI } from '../utils/fieldEditorUtils';

interface FieldEditorProps {
  field: ContentTypeField;
  value: string;
  onChange: (value: string) => void;
  defaultLocale: string;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  value,
  onChange,
  defaultLocale,
}) => {
  // Ensure Lingui i18n is activated for editors that rely on it (e.g., JsonEditor)
  useEffect(() => {
    if (i18n.locale !== defaultLocale) {
      try {
        i18n.load(defaultLocale, {});
        i18n.activate(defaultLocale);
      } catch {}
    }
  }, [defaultLocale]);

  const fieldApi = useMemo(
    () => createFieldAPI(field, value, onChange, defaultLocale),
    [field, value, onChange, defaultLocale]
  );

  const localesApi = useMemo(() => createLocalesAPI(defaultLocale), [defaultLocale]);

  const renderEditor = () => {
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
      case 'Date':
        return <DateEditor field={fieldApi} isInitiallyDisabled={false} />;
      case 'Array':
        // Short text array: items.type === 'Symbol'
        return <TagsEditor field={fieldApi} isInitiallyDisabled={false} />;
      case 'Boolean':
        return <BooleanEditor field={fieldApi} isInitiallyDisabled={false} />;
      case 'Object':
        return <JsonEditor field={fieldApi} isInitiallyDisabled={false} />;
      default:
        return (
          <TextInput
            name="bulk-edit-value"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your new value"
            type="text"
            autoFocus
          />
        );
    }
  };

  return <div>{renderEditor()}</div>;
};
