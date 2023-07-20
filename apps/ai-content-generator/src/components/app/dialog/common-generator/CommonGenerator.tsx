import { useContext, useEffect, useReducer } from 'react';
import { Flex } from '@contentful/f36-components';
import { GeneratorContext } from '@providers/generatorProvider';
import FieldSelector from '@components/app/dialog/common-generator/field-selector/FieldSelector';
import Output from '@components/app/dialog/common-generator/output/Output';
import { TextFields } from '@hooks/dialog/useSupportedFields';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import { FeatureComponentProps } from '@configs/features/featureTypes';
import generatorReducer, { GeneratorParameters } from './generatorReducer';
import NewOrExistingText from './new-or-existing-text/NewOrExistingText';

const initialParameters: GeneratorParameters = {
  isNewText: false,
  locale: '',
  targetLocale: '',
  sourceField: '',
  outputField: '',
  originalText: '',
};

const CommonGenerator = (props: FeatureComponentProps) => {
  const { isTranslate } = props;
  const { setProviderData } = useContext(GeneratorContext);

  const sdk = useSDK<DialogAppSDK>();

  const [parameters, dispatch] = useReducer(generatorReducer, {
    ...initialParameters,
    locale: sdk.locales.default,
  });

  const updateProviderData = () => {
    const { targetLocale, locale } = parameters;
    setProviderData({
      targetLocale: targetLocale || locale,
      dispatch,
    });
  };

  useEffect(updateProviderData, [parameters.targetLocale, parameters.locale, dispatch]);

  return (
    <Flex>
      <NewOrExistingText isNewText={parameters.isNewText} dispatch={dispatch} />
      <FieldSelector parameters={parameters} isTranslate={isTranslate} fieldTypes={TextFields} />
      <Output outputField={parameters.outputField} inputText={parameters.originalText} />
    </Flex>
  );
};

export default CommonGenerator;
