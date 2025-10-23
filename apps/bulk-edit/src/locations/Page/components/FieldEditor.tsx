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
import { createFieldAPI } from '../utils/fieldEditorUtils';
import type { LocalesAPI } from '@contentful/field-editor-shared';
import { PageAppSDK } from '@contentful/app-sdk';
import { EditorInterfaceProps } from 'contentful-management';
import { useSDK } from '@contentful/react-apps-toolkit';

interface FieldEditorProps {
  field: ContentTypeField;
  value: string;
  onChange: (value: string) => void;
  locales: LocalesAPI;
}

const ERROR_MESSAGE = 'Failed to initialize field editor. Please try again.';
export const FieldEditor: React.FC<FieldEditorProps> = ({ field, value, onChange, locales }) => {
  const sdk = useSDK<PageAppSDK>();
  const [error, setError] = useState('');
  const [editorInterface, setEditorInterface] = useState<EditorInterfaceProps | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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

  useEffect(() => {
    const fetchEditorInterface = async (): Promise<void> => {
      try {
        setLoading(true);
        setEditorInterface(
          await sdk.cma.editorInterface.get({
            contentTypeId: field.contentTypeId,
          })
        );
      } catch (e) {
        setEditorInterface(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchEditorInterface();
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
          const booleanSettings = editorInterface?.controls?.find(
            (c) => c.fieldId === field.id
          )?.settings;
          const trueLabel = booleanSettings?.trueLabel;
          const falseLabel = booleanSettings?.falseLabel;

          return loading ? (
            <Skeleton.Container>
              <Skeleton.BodyText numberOfLines={1} />
            </Skeleton.Container>
          ) : (
            <BooleanEditor
              field={fieldApi}
              isInitiallyDisabled={false}
              parameters={{
                installation: {},
                instance: {
                  trueLabel: trueLabel ? String(trueLabel) : 'True',
                  falseLabel: falseLabel ? String(falseLabel) : 'False',
                },
                invocation: {},
              }}
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
