import {
  GeneratorAction,
  GeneratorReducer,
} from '@components/app/dialog/common-generator/generatorReducer';
import { Field } from '@hooks/dialog/useSupportedFields';
import { Dispatch } from 'react';

/**
 * This finds a field in a list of fields and returns the field id, key, name, locale, and data.
 * @param fieldKey
 * @param fields
 * @returns
 */
const getFieldData = (fieldKey: string, fields: Field[]) => {
  const field = fields.find((field) => field.key === fieldKey);
  return (
    field ?? {
      id: '',
      key: '',
      name: '',
      locale: '',
      data: '',
      language: '',
      sizeValidation: null,
      isDefaultLocale: false,
    }
  );
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
    sourceField: sourceField.key || fallbackField.key,
    value: sourceField.key ? sourceField.data : fallbackField.data,
  });
};

/**
 * Dispatches an action to update the output field.
 * @param outputField
 * @param fallbackField
 * @param dispatch
 */
const updateOutputField = (
  outputField: Field,
  fallbackField: Field,
  dispatch: Dispatch<GeneratorReducer>
) => {
  dispatch({
    type: GeneratorAction.UPDATE_OUTPUT_FIELD,
    field: outputField.key || fallbackField.key,
    id: outputField.id,
    locale: outputField.locale,
    validation: outputField.sizeValidation,
  });
};

export { getFieldData, updateSourceField, updateOutputField };
