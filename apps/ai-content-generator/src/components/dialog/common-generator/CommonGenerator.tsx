import { useReducer } from 'react';
import { Flex } from '@contentful/f36-components';
import FieldSelector from '@components/dialog/common-generator/field-selector/FieldSelector';
import Output from '@components/dialog/common-generator/output/Output';
import { TextFields } from '@hooks/dialog/useSupportedFields';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import generatorReducer, { GeneratorParameters } from './generatorReducer';
import { FeatureComponentProps } from '@configs/features/featureTypes';
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
  const { entryId, feature, isTranslate } = props;
  const sdk = useSDK<DialogAppSDK>();

  const [parameters, dispatch] = useReducer(generatorReducer, {
    ...initialParameters,
    locale: sdk.locales.default,
  });

  return (
    <Flex>
      <NewOrExistingText isNewText={parameters.isNewText} dispatch={dispatch} />
      <FieldSelector
        parameters={parameters}
        entryId={entryId}
        isTranslate={isTranslate}
        fieldTypes={TextFields}
        dispatch={dispatch}
      />
      <Output
        inputText={parameters.originalText}
        locale={parameters.targetLocale || parameters.locale}
        prompt={feature.prompt}
        dispatch={dispatch}
      />
    </Flex>
  );
};

export default CommonGenerator;
