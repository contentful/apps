import SourceAndFieldSelectors from '@components/app/dialog/common-generator/field-selector/SourceAndFieldSelectors';
import Header from '@components/app/dialog/common-generator/header/Header';
import Output from '@components/app/dialog/common-generator/output/Output';
import featureConfig from '@configs/features/featureConfig';
import { Box, Flex } from '@contentful/f36-components';
import { GenerateMessage } from '@hooks/dialog/useAI';
import { TextFields } from '@hooks/dialog/useSupportedFields';
import { GeneratorContext, GeneratorState } from '@providers/generatorProvider';
import { useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import generatorReducer, { GeneratorParameters } from './generatorReducer';

const initialParameters: GeneratorParameters = {
  isNewText: false,
  sourceField: '',
  output: {
    fieldId: '',
    fieldKey: '',
    locale: '',
    validation: null,
  },
  originalText: { prompt: '', field: '' },
  canGenerateTextFromField: false,
};

const CommonGenerator = () => {
  const { setProviderData, feature, localeNames, state } = useContext(GeneratorContext);

  const [parameters, dispatch] = useReducer(generatorReducer, initialParameters);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLElement>(null);

  const newState: GeneratorState = useMemo(
    () => ({
      feature_id: feature,
      from_prompt: parameters.isNewText,
      source_field: parameters.isNewText ? '' : parameters.sourceField.split(':')[1],
      content_generation_prompt: parameters.originalText.prompt || undefined,
      target_locale: parameters.output.locale,
    }),
    [
      feature,
      parameters.isNewText,
      parameters.originalText.prompt,
      parameters.output.locale,
      parameters.sourceField,
    ]
  );

  const updateProviderData = () => {
    if (newState !== state)
      setProviderData({
        dispatch,
        state: newState,
      });
  };

  useEffect(updateProviderData, [dispatch, newState, setProviderData, state]);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.clientHeight);
    }
  }, []);

  const inputText = parameters.isNewText
    ? parameters.originalText.prompt
    : parameters.originalText.field;

  const handleGenerate = async (generateMessage: GenerateMessage) => {
    try {
      const localeName = localeNames[parameters.output.locale];
      const userMessage = featureConfig[feature].prompt(inputText, localeName);
      await generateMessage(userMessage, localeName);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Flex flexDirection="column">
      <Box ref={headerRef}>
        <Header />
        <SourceAndFieldSelectors parameters={parameters} fieldTypes={TextFields} />
      </Box>
      <Output
        onGenerate={handleGenerate}
        outputFieldId={parameters.output.fieldId}
        outputFieldLocale={parameters.output.locale}
        outputFieldValidation={parameters.output.validation}
        inputText={inputText}
        isNewText={parameters.isNewText}
        headerHeight={headerHeight}
      />
    </Flex>
  );
};

export default CommonGenerator;
