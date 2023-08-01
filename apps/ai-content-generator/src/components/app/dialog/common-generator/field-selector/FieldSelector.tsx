import useSupportedFields, { SupportedFieldTypes } from '@hooks/dialog/useSupportedFields';
import { Flex } from '@contentful/f36-components';
import { GeneratorAction, GeneratorParameters } from '../generatorReducer';
import { ChangeEvent, useContext, useEffect } from 'react';
import EntryFieldList from './field-list/EntryFieldList';
import { GeneratorContext } from '@providers/generatorProvider';
import {
  getFieldData,
  updateOutputField,
  updateSourceField,
} from '@utils/dialog/common-generator/field-selector/fieldSelectorHelpers';

interface Props {
  parameters: GeneratorParameters;
  fieldTypes: SupportedFieldTypes[];
}

const FieldSelector = (props: Props) => {
  const { parameters, fieldTypes } = props;
  const { isNewText, sourceField, output } = parameters;
  const { entryId, dispatch, fieldLocales, localeNames, defaultLocale } =
    useContext(GeneratorContext);

  const { supportedFieldsWithContent, allSupportedFields } = useSupportedFields(
    entryId,
    fieldTypes,
    fieldLocales,
    localeNames,
    defaultLocale
  );

  const handleSelectChange = (action: GeneratorAction) => {
    if (action === GeneratorAction.UPDATE_SOURCE_FIELD) {
      return (event: ChangeEvent<HTMLSelectElement>) => {
        const sourceFieldData = getFieldData(event.target.value, supportedFieldsWithContent);
        updateSourceField(sourceFieldData, supportedFieldsWithContent[0], dispatch);
      };
    }

    if (action === GeneratorAction.UPDATE_OUTPUT_FIELD) {
      return (event: ChangeEvent<HTMLSelectElement>) => {
        const outputFieldData = getFieldData(event.target.value, allSupportedFields);
        updateOutputField(outputFieldData, allSupportedFields[0], dispatch);
      };
    }

    return (event: ChangeEvent<HTMLSelectElement>) =>
      dispatch({
        type: action,
        value: event.target.value,
      });
  };

  const handleBaseDataChange = () => {
    if (supportedFieldsWithContent.length) {
      const sourceFieldData = getFieldData(
        isNewText ? sourceField : '',
        supportedFieldsWithContent
      );
      updateSourceField(sourceFieldData, supportedFieldsWithContent[0], dispatch);
    }

    if (allSupportedFields.length) {
      const outputFieldData = getFieldData(output.fieldId, allSupportedFields);
      updateOutputField(outputFieldData, allSupportedFields[0], dispatch);
    }
  };

  useEffect(handleBaseDataChange, [isNewText]);

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
        selectedField={output.fieldKey}
        fields={allSupportedFields}
        onChange={handleSelectChange(GeneratorAction.UPDATE_OUTPUT_FIELD)}
      />
    </Flex>
  );
};

export default FieldSelector;
