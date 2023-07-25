import {
  GeneratorAction,
  GeneratorReducer,
} from '@components/app/dialog/common-generator/generatorReducer';
import { Field } from '@hooks/dialog/useSupportedFields';
import { Dispatch } from 'react';

/**
 * This finds a field in a list of fields and returns the field id, name, and data.
 * @param fieldId
 * @param fields
 * @returns
 */
const getFieldData = (fieldId: string, fields: Field[]) => {
  const field = fields.find((field) => field.id === fieldId);
  return field
    ? { id: field.id, name: field.name, data: field.data || '' }
    : { id: '', name: '', data: '' };
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
    field: sourceField.id || fallbackField.id,
    value: sourceField.id ? sourceField.data : fallbackField.data,
  });
};

/**
 * Dispatches an action to update the output field.
 * @param outputFieldId
 * @param fallbackField
 * @param dispatch
 */
const updateOutputField = (
  outputFieldId: string,
  fallbackField: Field,
  dispatch: Dispatch<GeneratorReducer>
) => {
  dispatch({
    type: GeneratorAction.UPDATE_OUTPUT_FIELD,
    value: outputFieldId || fallbackField.id,
  });
};

export { getFieldData, updateSourceField, updateOutputField };
