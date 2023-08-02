import useSupportedFields, { SupportedFieldTypes } from '@hooks/dialog/useSupportedFields';
import { Box, Flex } from '@contentful/f36-components';
import { GeneratorAction, GeneratorParameters } from '../generatorReducer';
import { ChangeEvent, useContext, useEffect } from 'react';
import EntryFieldList from './field-list/EntryFieldList';
import ContentSource from './content-source/ContentSource';
import { GeneratorContext } from '@providers/generatorProvider';
import {
  getFieldData,
  updateOutputField,
  updateSourceField,
} from '@utils/dialog/common-generator/field-selector/fieldSelectorHelpers';
import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

const SELECT_WIDTH = 280;

const styles = {
  wrapper: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
  }),
};

interface Props {
  parameters: GeneratorParameters;
  fieldTypes: SupportedFieldTypes[];
}

const SourceAndFieldSelectors = (props: Props) => {
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

  const changeTextSource = () => {
    const type = !isNewText ? GeneratorAction.IS_NEW_TEXT : GeneratorAction.IS_NOT_NEW_TEXT;
    dispatch({ type });
  };

  return (
    <Box css={styles.wrapper}>
      <Flex justifyContent="center">
        <ContentSource
          title="Content Source"
          isNewText={isNewText}
          onChange={changeTextSource}
          selectFieldWidth={SELECT_WIDTH}
        />

        {!isNewText && (
          <EntryFieldList
            title="Source Field"
            selectedField={sourceField}
            fields={supportedFieldsWithContent}
            onChange={handleSelectChange(GeneratorAction.UPDATE_SOURCE_FIELD)}
            selectFieldWidth={SELECT_WIDTH}
          />
        )}

        <EntryFieldList
          title="Output Field"
          selectedField={output.fieldKey}
          fields={allSupportedFields}
          onChange={handleSelectChange(GeneratorAction.UPDATE_OUTPUT_FIELD)}
          selectFieldWidth={SELECT_WIDTH}
        />
      </Flex>
    </Box>
  );
};

export default SourceAndFieldSelectors;
