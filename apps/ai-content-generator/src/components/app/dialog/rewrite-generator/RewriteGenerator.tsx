import { useContext, useEffect, useReducer, useState } from 'react';
import { Flex } from '@contentful/f36-components';
import { GeneratorContext } from '@providers/generatorProvider';
import SourceAndFieldSelectors from '@components/app/dialog/common-generator/field-selector/SourceAndFieldSelectors';
import Header from '@components/app/dialog/common-generator/header/Header';
import Output from '@components/app/dialog/common-generator/output/Output';
import { TextFields } from '@hooks/dialog/useSupportedFields';
import generatorReducer, {
  GeneratorParameters,
} from '@components/app/dialog/common-generator/generatorReducer';
import ButtonTextField from './button-text-field/ButtonTextField';
import { GenerateMessage } from '@hooks/dialog/useAI';
import featureConfig from '@configs/features/featureConfig';

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

const RewriteGenerator = () => {
  const { setProviderData, localeNames, feature } = useContext(GeneratorContext);

  const [parameters, dispatch] = useReducer(generatorReducer, initialParameters);
  const [rewritePromptData, setRewritePromptData] = useState('');

  const updateProviderData = () => {
    setProviderData({
      dispatch,
    });
  };

  useEffect(updateProviderData, [dispatch]);

  const inputText = parameters.isNewText
    ? parameters.originalText.prompt
    : parameters.originalText.field;

  const handleGenerate = async (generateMessage: GenerateMessage) => {
    try {
      const localeName = localeNames[parameters.output.locale];
      const userMessage = featureConfig[feature].prompt(inputText, localeName, rewritePromptData);
      await generateMessage(userMessage, localeName);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Flex flexDirection="column">
      <Header />
      <SourceAndFieldSelectors parameters={parameters} fieldTypes={TextFields} />
      <ButtonTextField inputValue={rewritePromptData} handleInputChange={setRewritePromptData} />
      <Output
        onGenerate={handleGenerate}
        outputFieldId={parameters.output.fieldId}
        outputFieldLocale={parameters.output.locale}
        outputFieldValidation={parameters.output.validation}
        inputText={inputText}
        isNewText={parameters.isNewText}
      />
    </Flex>
  );
};

export default RewriteGenerator;
