import useSupportedFields, { SupportedFieldTypes } from '@hooks/dialog/useSupportedFields';
import { Flex } from '@contentful/f36-components';
import { GeneratorAction, GeneratorReducer, GeneratorParameters } from '../generatorReducer';
import { Dispatch, useEffect } from 'react';
import AvailableLocales from './available-locales/AvailableLocales';
import EntryFieldList from './field-list/EntryFieldList';

interface Props {
  parameters: GeneratorParameters;
  entryId: string;
  isTranslate?: boolean;
  fieldTypes: SupportedFieldTypes[];
  dispatch: Dispatch<GeneratorReducer>;
}

const FieldSelector = (props: Props) => {
  const { parameters, entryId, isTranslate, fieldTypes, dispatch } = props;
  const { isNewText, sourceField, outputField, locale, targetLocale } = parameters;
  const { supportedFields, fields } = useSupportedFields(entryId, fieldTypes, parameters.locale);

  useEffect(() => {
    if (fields.length) {
      dispatch({
        type: GeneratorAction.SOURCE_FIELD,
        field: fields[0].name,
        value: parameters.isNewText ? '' : fields[0].data,
      });
    }

    if (supportedFields.length) {
      dispatch({
        type: GeneratorAction.OUTPUT_FIELD,
        value: supportedFields[0].name,
      });
    }
  }, [fields, supportedFields, parameters.isNewText]);

  const handleSelectChange = (eventType: GeneratorAction) => {
    return (event: React.ChangeEvent<HTMLSelectElement>) => {
      const sourceFieldName = event.target.value;

      if (eventType === GeneratorAction.SOURCE_FIELD) {
        const newOriginalText = fields.find((field) => field.name === sourceFieldName);

        dispatch({
          type: GeneratorAction.SOURCE_FIELD,
          field: sourceFieldName,
          value: newOriginalText?.data || '',
        });
      } else {
        dispatch({
          type: eventType,
          value: sourceFieldName,
        });
      }
    };
  };

  const { SOURCE_FIELD, OUTPUT_FIELD, LOCALE, TARGET_LOCALE } = GeneratorAction;
  return (
    <Flex flexGrow={2} flexDirection="column" margin="spacingL">
      {!isNewText && (
        <EntryFieldList
          title="Source Field"
          selectedField={sourceField}
          fields={fields}
          onChange={handleSelectChange(SOURCE_FIELD)}
        />
      )}

      <EntryFieldList
        title="Output Field"
        selectedField={outputField}
        fields={supportedFields}
        onChange={handleSelectChange(OUTPUT_FIELD)}
      />

      <AvailableLocales
        title={isTranslate ? 'Source Language' : 'Language'}
        selectedLocale={locale}
        onChange={handleSelectChange(LOCALE)}
      />

      {isTranslate && (
        <AvailableLocales
          title="Target Language"
          selectedLocale={targetLocale || locale}
          onChange={handleSelectChange(TARGET_LOCALE)}
        />
      )}
    </Flex>
  );
};

export default FieldSelector;
