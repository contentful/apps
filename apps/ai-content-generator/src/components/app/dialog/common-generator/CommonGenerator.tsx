import { useContext, useEffect, useReducer } from 'react';
import { GeneratorContext } from '@providers/generatorProvider';
import SourceAndFieldSelectors from '@components/app/dialog/common-generator/field-selector/SourceAndFieldSelectors';
import Header from '@components/app/dialog/common-generator/header/Header';
import Output from '@components/app/dialog/common-generator/output/Output';
import { TextFields } from '@hooks/dialog/useSupportedFields';
import generatorReducer, { GeneratorParameters } from './generatorReducer';
import { styles } from './CommonGenerator.styles';

const initialParameters: GeneratorParameters = {
  isNewText: false,
  sourceField: '',
  output: {
    fieldId: '',
    fieldKey: '',
    locale: '',
    validation: null,
  },
  originalText: '',
  canGenerateTextFromField: false,
};

const CommonGenerator = () => {
  const { setProviderData } = useContext(GeneratorContext);

  const [parameters, dispatch] = useReducer(generatorReducer, initialParameters);

  const updateProviderData = () => {
    setProviderData({
      dispatch,
    });
  };

  useEffect(updateProviderData, [dispatch]);

  return (
    <div css={styles.root}>
      <Header />
      <SourceAndFieldSelectors parameters={parameters} fieldTypes={TextFields} />
      <Output
        outputFieldId={parameters.output.fieldId}
        outputFieldLocale={parameters.output.locale}
        outputFieldValidation={parameters.output.validation}
        inputText={parameters.originalText}
        isNewText={parameters.isNewText}
      />
    </div>
  );
};

export default CommonGenerator;
