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
    id: outputField.id || fallbackField.id,
    key: outputField.key,
    locale: outputField.locale,
    validation: outputField.sizeValidation,
  });
};

/**
 * Dispatches an action to update the Content Source
 * @param isNewText
 * @param dispatch
 */
const handleContentSourceChange = (isNewText: boolean, dispatch: Dispatch<GeneratorReducer>) => {
  const type = !isNewText ? GeneratorAction.IS_NEW_TEXT : GeneratorAction.IS_NOT_NEW_TEXT;
  dispatch({ type });
};

/**
 * Gets the data for the newly selected source field and calls a function to
 * dispatch an action to update the source field
 * @param newField
 * @param fields
 * @param dispatch
 */
const handleSourceFieldChange = (
  newField: string,
  fields: Field[],
  dispatch: Dispatch<GeneratorReducer>
) => {
  const sourceFieldData = getFieldData(newField, fields);
  updateSourceField(sourceFieldData, fields[0], dispatch);
};

/**
 * Gets the data for the newly selected output field and calls a function to
 * dispatch an action to update the output field
 * @param newField
 * @param fields
 * @param dispatch
 */
const handleOutputFieldChange = (
  newField: string,
  fields: Field[],
  dispatch: Dispatch<GeneratorReducer>
) => {
  const outputFieldData = getFieldData(newField, fields);
  updateOutputField(outputFieldData, fields[0], dispatch);
};

export { handleContentSourceChange, handleSourceFieldChange, handleOutputFieldChange };
