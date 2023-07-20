import {
  GeneratorAction,
  GeneratorReducer,
} from '@components/app/dialog/common-generator/generatorReducer';
import { Field } from '@hooks/dialog/useSupportedFields';
import { Dispatch } from 'react';

/**
 * This finds a field in a list of fields and returns the field name and data.
 * @param fieldName
 * @param fields
 * @returns
 */
const getFieldData = (fieldName: string, fields: Field[]) => {
  const field = fields.find((field) => field.name === fieldName);
  return field ? { name: field.name, data: field.data || '' } : { name: '', data: '' };
};

/**
 * Dispatches an action to update the source field.
 * @param sourceField
 * @param fallbackField
 * @param dispatch
 */
const updateSourceField = (
  sourceField: Field,
  fallbackField: Field,
  dispatch: Dispatch<GeneratorReducer>
) => {
  dispatch({
    type: GeneratorAction.UPDATE_SOURCE_FIELD,
    field: sourceField.name || fallbackField.name,
    value: sourceField.name ? sourceField.data : fallbackField.data,
  });
};

/**
 * Dispatches an action to update the output field.
 * @param outputFieldName
 * @param fallbackField
 * @param dispatch
 */
const updateOutputField = (
  outputFieldName: string,
  fallbackField: Field,
  dispatch: Dispatch<GeneratorReducer>
) => {
  dispatch({
    type: GeneratorAction.UPDATE_OUTPUT_FIELD,
    value: outputFieldName || fallbackField.name,
  });
};

export { getFieldData, updateSourceField, updateOutputField };
