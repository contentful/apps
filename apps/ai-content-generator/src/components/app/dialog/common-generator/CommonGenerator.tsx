import { useContext, useEffect, useReducer } from 'react';
import { GeneratorContext } from '@providers/generatorProvider';
import FieldSelector from '@components/app/dialog/common-generator/field-selector/FieldSelector';
import Output from '@components/app/dialog/common-generator/output/Output';
import { TextFields } from '@hooks/dialog/useSupportedFields';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import { FeatureComponentProps } from '@configs/features/featureTypes';
import generatorReducer, { GeneratorParameters } from './generatorReducer';
import NewOrExistingText from './new-or-existing-text/NewOrExistingText';
import { styles } from './CommonGenerator.styles';
import NoFieldsSelectedMessage from './output/output-text-panels/no-fields-selected-message/NoFieldsSelectedMessage';

const initialParameters: GeneratorParameters = {
  isNewText: false,
  locale: '',
  targetLocale: '',
  sourceField: '',
  outputField: '',
  originalText: '',
  canGenerateTextFromField: false,
};

const CommonGenerator = (props: FeatureComponentProps) => {
  const { isTranslate, isTitle } = props;
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
    <div css={styles.root}>
      <NewOrExistingText isTitle={isTitle} isNewText={parameters.isNewText} dispatch={dispatch} />
      <div css={styles.fieldSelectorRoot}>
        <FieldSelector parameters={parameters} isTranslate={isTranslate} fieldTypes={TextFields} />
      </div>
      {parameters.canGenerateTextFromField ? (
        <Output outputField={parameters.outputField} inputText={parameters.originalText} />
      ) : (
        <NoFieldsSelectedMessage />
      )}
    </div>
  );
};

export default CommonGenerator;
