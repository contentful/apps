import {
  GeneratorAction,
  GeneratorReducer,
} from '@components/dialog/common-generator/generatorReducer';
import { Field } from '@hooks/dialog/useSupportedFields';
import { Dispatch } from 'react';

const getFieldData = (fieldName: string, fields: Field[]) => {
  const field = fields.find((field) => field.name === fieldName);
  return field ? { name: field.name, data: field.data || '' } : { name: '', data: '' };
};

const updateSourceField = (
  sourceField: Field,
  fallbackField: Field,
  dispatch: Dispatch<GeneratorReducer>
) => {
  dispatch({
    type: GeneratorAction.SOURCE_FIELD,
    field: sourceField.name || fallbackField.name,
    value: sourceField.name ? sourceField.data : fallbackField.data,
  });
};

const updateOutputField = (
  outputFieldName: string,
  fallbackField: Field,
  dispatch: Dispatch<GeneratorReducer>
) => {
  dispatch({
    type: GeneratorAction.OUTPUT_FIELD,
    value: outputFieldName || fallbackField.name,
  });
};

export { getFieldData, updateSourceField, updateOutputField };
