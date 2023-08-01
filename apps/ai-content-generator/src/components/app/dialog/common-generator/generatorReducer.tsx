import { ContentTypeFieldValidation } from 'contentful-management/types';

export enum GeneratorAction {
  IS_NEW_TEXT = 'isNewText',
  IS_NOT_NEW_TEXT = 'isNotNewText',
  UPDATE_SOURCE_FIELD = 'changeSourceField',
  UPDATE_OUTPUT_FIELD = 'changeOutputField',
  UPDATE_ORIGINAL_TEXT = 'changeOriginalText',
}

export type GeneratorParameters = {
  isNewText: boolean;
  // can generate text from field when both source and output fields are selected
  canGenerateTextFromField: boolean;
  sourceField: string;
  originalText: string;
  output: {
    field: string;
    id: string;
    locale: string;
    validation: ContentTypeFieldValidation | null;
  };
};

type GeneratorStringAction = {
  type: GeneratorAction.UPDATE_ORIGINAL_TEXT;
  value: string;
};

type GeneratorSourceTextAction = {
  type: GeneratorAction.UPDATE_SOURCE_FIELD;
  sourceField: string;
  value: string;
};

type GeneratorOutputTextAction = {
  type: GeneratorAction.UPDATE_OUTPUT_FIELD;
  field: string;
  id: string;
  locale: string;
  validation: ContentTypeFieldValidation | null;
};

type GeneratorImpulseAction = {
  type: GeneratorAction.IS_NEW_TEXT | GeneratorAction.IS_NOT_NEW_TEXT;
};

export type GeneratorReducer =
  | GeneratorStringAction
  | GeneratorSourceTextAction
  | GeneratorOutputTextAction
  | GeneratorImpulseAction;

const {
  IS_NEW_TEXT,
  IS_NOT_NEW_TEXT,
  UPDATE_SOURCE_FIELD,
  UPDATE_OUTPUT_FIELD,
  UPDATE_ORIGINAL_TEXT,
} = GeneratorAction;

const generatorReducer = (
  state: GeneratorParameters,
  action: GeneratorReducer
): GeneratorParameters => {
  switch (action.type) {
    case IS_NEW_TEXT:
      return { ...state, isNewText: true, originalText: '' };
    case IS_NOT_NEW_TEXT:
      return { ...state, isNewText: false, originalText: '' };
    case UPDATE_SOURCE_FIELD:
      return {
        ...state,
        canGenerateTextFromField: Boolean(action.sourceField && state.output.field),
        sourceField: action.sourceField,
        originalText: action.value,
      };
    case UPDATE_OUTPUT_FIELD:
      return {
        ...state,
        canGenerateTextFromField: Boolean(action.field && state.sourceField),
        output: {
          field: action.field,
          id: action.id,
          locale: action.locale,
          validation: action.validation,
        },
      };
    case UPDATE_ORIGINAL_TEXT:
      return { ...state, originalText: action.value };
    default:
      return state;
  }
};

export default generatorReducer;
