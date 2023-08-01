import { useContext, useEffect, useReducer } from 'react';
import { GeneratorContext } from '@providers/generatorProvider';
import FieldSelector from '@components/app/dialog/common-generator/field-selector/FieldSelector';
import Output from '@components/app/dialog/common-generator/output/Output';
import { TextFields } from '@hooks/dialog/useSupportedFields';
import { FeatureComponentProps } from '@configs/features/featureTypes';
import generatorReducer, { GeneratorParameters } from './generatorReducer';
import NewOrExistingText from './new-or-existing-text/NewOrExistingText';
import { styles } from './CommonGenerator.styles';
import NoFieldsSelectedMessage from './output/output-text-panels/no-fields-selected-message/NoFieldsSelectedMessage';

const initialParameters: GeneratorParameters = {
  isNewText: false,
  sourceField: '',
  output: {
    field: '',
    id: '',
    locale: '',
    validation: null,
  },
  originalText: '',
  canGenerateTextFromField: false,
};

const CommonGenerator = (props: FeatureComponentProps) => {
  const { isTitle } = props;
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
      <NewOrExistingText isTitle={isTitle} isNewText={parameters.isNewText} dispatch={dispatch} />
      <div css={styles.fieldSelectorRoot}>
        <FieldSelector parameters={parameters} fieldTypes={TextFields} />
      </div>
      {parameters.canGenerateTextFromField ? (
        <Output
          outputFieldId={parameters.output.field}
          outputFieldLocale={parameters.output.locale}
          outputFieldValidation={parameters.output.validation}
          inputText={parameters.originalText}
        />
      ) : (
        <NoFieldsSelectedMessage />
      )}
    </div>
  );
};

export default CommonGenerator;
