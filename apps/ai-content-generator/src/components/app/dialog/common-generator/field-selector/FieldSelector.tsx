import useSupportedFields, { SupportedFieldTypes } from '@hooks/dialog/useSupportedFields';
import { Flex } from '@contentful/f36-components';
import { GeneratorAction, GeneratorParameters } from '../generatorReducer';
import { ChangeEvent, useContext, useEffect } from 'react';
import AvailableLocales from './available-locales/AvailableLocales';
import EntryFieldList from './field-list/EntryFieldList';
import { GeneratorContext } from '@providers/generatorProvider';
import {
  getFieldData,
  updateOutputField,
  updateSourceField,
} from '@utils/dialog/common-generator/field-selector/fieldSelectorHelpers';

interface Props {
  parameters: GeneratorParameters;
  isTranslate?: boolean;
  fieldTypes: SupportedFieldTypes[];
}

const FieldSelector = (props: Props) => {
  const { parameters, isTranslate, fieldTypes } = props;
  const { isNewText, sourceField, outputField, locale, targetLocale } = parameters;
  const { entryId, dispatch } = useContext(GeneratorContext);

  const { supportedFieldsWithContent, allSupportedFields } = useSupportedFields(
    entryId,
    fieldTypes,
    locale
  );

  const handleSelectChange = (action: GeneratorAction) => {
    if (action === GeneratorAction.UPDATE_SOURCE_FIELD) {
      return (event: ChangeEvent<HTMLSelectElement>) => {
        const sourceFieldData = getFieldData(event.target.value, supportedFieldsWithContent);
        updateSourceField(sourceFieldData, supportedFieldsWithContent[0], dispatch);
      };
    }

    if (action === GeneratorAction.UPDATE_OUTPUT_FIELD) {
      return (event: ChangeEvent<HTMLSelectElement>) =>
        updateOutputField(event.target.value, allSupportedFields[0], dispatch);
    }

    return (event: ChangeEvent<HTMLSelectElement>) =>
      dispatch({
        type: action,
        value: event.target.value,
      });
  };

  const handleBaseDataChange = () => {
    if (supportedFieldsWithContent.length) {
      const sourceFieldData = isNewText
        ? { id: '', name: '', data: '' }
        : getFieldData(sourceField, supportedFieldsWithContent);
      updateSourceField(sourceFieldData, supportedFieldsWithContent[0], dispatch);
    }
    if (allSupportedFields.length) {
      updateOutputField(outputField, allSupportedFields[0], dispatch);
    }
  };

  useEffect(handleBaseDataChange, [isNewText, locale]);

  const { UPDATE_LOCALE, UPDATE_TARGET_LOCALE } = GeneratorAction;
  return (
    <Flex flexGrow={2} flexDirection="column" margin="spacingL">
      {!isNewText && (
        <EntryFieldList
          title="Source Field"
          selectedField={sourceField}
          fields={supportedFieldsWithContent}
          onChange={handleSelectChange(GeneratorAction.UPDATE_SOURCE_FIELD)}
        />
      )}

      <EntryFieldList
        title="Output Field"
        selectedField={outputField}
        fields={allSupportedFields}
        onChange={handleSelectChange(GeneratorAction.UPDATE_OUTPUT_FIELD)}
      />

      <AvailableLocales
        title={isTranslate ? 'Source Language' : 'Language'}
        selectedLocale={locale}
        onChange={handleSelectChange(UPDATE_LOCALE)}
      />

      {isTranslate && (
        <AvailableLocales
          title="Target Language"
          selectedLocale={targetLocale || locale}
          onChange={handleSelectChange(UPDATE_TARGET_LOCALE)}
        />
      )}
    </Flex>
  );
};

export default FieldSelector;
