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
import type { ContentTypeField, FieldValue, LinkRef, DialogsSDK } from '../types';
import { Button, Flex, Note, Text } from '@contentful/f36-components';
import {
  createFieldAPI,
  getCustomBooleanLabels,
  getBooleanEditorParameters,
} from '../utils/fieldEditorUtils';
import type { LocalesAPI } from '@contentful/field-editor-shared';

function isEntryLink(v: unknown): v is LinkRef {
  return (
    !!v &&
    typeof v === 'object' &&
    (v as LinkRef).sys?.type === 'Link' &&
    (v as LinkRef).sys?.linkType === 'Entry' &&
    typeof (v as LinkRef).sys?.id === 'string'
  );
}

interface FieldEditorProps {
  field: ContentTypeField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  locales: LocalesAPI;
  sdk?: { dialogs: DialogsSDK };
}

const ERROR_MESSAGE = 'Failed to initialize field editor. Please try again.';
const SUPPORTED_WIDGET_IDS = new Set([
  'singleLine',
  'dropdown',
  'radio',
  'multipleLine',
  'numberEditor',
  'datePicker',
  'listInput',
  'checkbox',
  'tagEditor',
  'boolean',
  'objectEditor',
  'entryLinkEditor',
]);
const FIELD_TYPE_TO_DEFAULT_WIDGET: Record<string, string> = {
  Symbol: 'singleLine',
  Text: 'multipleLine',
  Number: 'numberEditor',
  Integer: 'numberEditor',
  Date: 'datePicker',
  Array: 'tagEditor',
  Boolean: 'boolean',
  Object: 'objectEditor',
  Link: 'entryLinkEditor',
};

export const FieldEditor: React.FC<FieldEditorProps> = ({ field, value, onChange, locales, sdk }) => {
  const [error, setError] = useState('');
  const locale = field.locale ? field.locale : locales.default;

  const fieldApi = useMemo(() => {
    return createFieldAPI(field, value, onChange, locale);
  }, [field, value, onChange, locale]);

  const getWidgetId = (field: ContentTypeField) => {
    if (field.fieldControl?.widgetId && SUPPORTED_WIDGET_IDS.has(field.fieldControl.widgetId)) {
      return field.fieldControl.widgetId;
    }
    return FIELD_TYPE_TO_DEFAULT_WIDGET[field.type] || 'unknown';
  };

  const renderEditor = () => {
    try {
      switch (getWidgetId(field)) {
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

        case 'entryLinkEditor': {
          if (!sdk) return <Note variant="negative">SDK unavailable for reference field.</Note>;
          const linkVal = isEntryLink(value) ? value : null;
          const allowedContentTypes = (field.validations ?? [])
            .flatMap((v: any) => v.linkContentType ?? []);
          const handleSelect = async () => {
            try {
              const selected = await sdk.dialogs.selectSingleEntry(
                allowedContentTypes.length > 0 ? { contentTypes: allowedContentTypes } : {}
              );
              if (selected) {
                onChange({ sys: { type: 'Link', linkType: 'Entry', id: selected.sys.id } });
              }
            } catch (e) {
              console.error('Failed to select entry:', e);
              setError('Failed to open entry selector. Please try again.');
            }
          };
          return (
            <Flex gap="spacingS" alignItems="center" flexWrap="wrap">
              {linkVal ? (
                <Text>
                  Selected:{' '}
                  <Text fontWeight="fontWeightDemiBold">{linkVal.sys.id}</Text>
                </Text>
              ) : (
                <Text>No entry selected</Text>
              )}
              <Button size="small" variant="secondary" onClick={handleSelect}>
                {linkVal ? 'Change entry' : 'Select entry'}
              </Button>
              {linkVal && (
                <Button size="small" variant="secondary" onClick={() => onChange(null)}>
                  Clear
                </Button>
              )}
            </Flex>
          );
        }

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

  return (
    <>
      {SUPPORTED_WIDGET_IDS.has(getWidgetId(field)) && (
        <Note>
          This field uses an unsupported custom appereance, the default editor for the field will be
          used instead.
        </Note>
      )}
      {renderEditor()}
    </>
  );
};
