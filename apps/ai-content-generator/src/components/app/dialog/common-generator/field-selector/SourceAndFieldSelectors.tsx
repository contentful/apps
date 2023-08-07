import useSupportedFields, { SupportedFieldTypes } from '@hooks/dialog/useSupportedFields';
import { Box, Flex, Select } from '@contentful/f36-components';
import { GeneratorParameters } from '../generatorReducer';
import { ChangeEvent, useContext } from 'react';
import Selector from './selector/Selector';
import { Field } from '@hooks/dialog/useSupportedFields';
import { GeneratorContext } from '@providers/generatorProvider';
import {
  handleContentSourceChange,
  handleSourceFieldChange,
  handleOutputFieldChange,
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

enum ContentSourceOptions {
  FIELD = 'field',
  PROMPT = 'prompt',
}

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

  const getSourceOptions = () => {
    const sources = [
      { id: ContentSourceOptions.FIELD, name: 'Field' },
      { id: ContentSourceOptions.PROMPT, name: 'Prompt' },
    ];

    return sources.map((source) => (
      <Select.Option key={source.id} value={source.id}>
        {source.name}
      </Select.Option>
    ));
  };

  const getFieldOptions = (fields: Field[]) => {
    const defaultOption = (
      <Select.Option key="default-0" value="" isDisabled>
        Select field...
      </Select.Option>
    );

    const fieldOptions = fields.map((field) => (
      <Select.Option key={field.key} value={field.key}>
        {field.name}
      </Select.Option>
    ));

    return [defaultOption, ...fieldOptions];
  };

  const onContentSourceChange = () => handleContentSourceChange(isNewText, dispatch);

  const onSourceFieldChange = (event: ChangeEvent<HTMLSelectElement>) =>
    handleSourceFieldChange(event.target.value, supportedFieldsWithContent, dispatch);

  const onOutputFieldChange = (event: ChangeEvent<HTMLSelectElement>) =>
    handleOutputFieldChange(event.target.value, allSupportedFields, dispatch);

  return (
    <Box css={styles.wrapper}>
      <Flex justifyContent="center">
        <Selector
          title="Content Source"
          selectedValue={isNewText ? ContentSourceOptions.PROMPT : ContentSourceOptions.FIELD}
          options={getSourceOptions()}
          onChange={onContentSourceChange}
          selectFieldWidth={SELECT_WIDTH}
        />

        {!isNewText && (
          <Selector
            title="Source Field"
            selectedValue={sourceField}
            options={getFieldOptions(supportedFieldsWithContent)}
            onChange={onSourceFieldChange}
            selectFieldWidth={SELECT_WIDTH}
          />
        )}

        <Selector
          title="Output Field"
          selectedValue={output.fieldKey}
          options={getFieldOptions(allSupportedFields)}
          onChange={onOutputFieldChange}
          selectFieldWidth={SELECT_WIDTH}
        />
      </Flex>
    </Box>
  );
};

export default SourceAndFieldSelectors;
