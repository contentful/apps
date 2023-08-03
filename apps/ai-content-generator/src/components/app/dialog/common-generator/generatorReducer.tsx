import { ContentTypeFieldValidation } from 'contentful-management/types';

export enum GeneratorAction {
  IS_NEW_TEXT = 'isNewText',
  IS_NOT_NEW_TEXT = 'isNotNewText',
  UPDATE_SOURCE_FIELD = 'changeSourceField',
  UPDATE_OUTPUT_FIELD = 'changeOutputField',
  UPDATE_ORIGINAL_TEXT_PROMPT = 'changeOriginalTextPrompt',
  UPDATE_ORIGINAL_TEXT_FIELD = 'changeOriginalTextField',
}

export type GeneratorParameters = {
  isNewText: boolean;
  // can generate text from field when both source and output fields are selected
  canGenerateTextFromField: boolean;
  sourceField: string;
  originalText: {
    prompt: string;
    field: string;
  };
  output: {
    fieldId: string;
    fieldKey: string;
    locale: string;
    validation: ContentTypeFieldValidation | null;
  };
};

type GeneratorTextPromptAction = {
  type: GeneratorAction.UPDATE_ORIGINAL_TEXT_PROMPT;
  value: string;
};

type GeneratorTextFieldAction = {
  type: GeneratorAction.UPDATE_ORIGINAL_TEXT_FIELD;
  value: string;
};

type GeneratorSourceTextAction = {
  type: GeneratorAction.UPDATE_SOURCE_FIELD;
  sourceField: string;
  value: string;
};

type GeneratorOutputTextAction = {
  type: GeneratorAction.UPDATE_OUTPUT_FIELD;
  id: string;
  key: string;
  locale: string;
  validation: ContentTypeFieldValidation | null;
};

type GeneratorImpulseAction = {
  type: GeneratorAction.IS_NEW_TEXT | GeneratorAction.IS_NOT_NEW_TEXT;
};

export type GeneratorReducer =
  | GeneratorTextPromptAction
  | GeneratorTextFieldAction
  | GeneratorSourceTextAction
  | GeneratorOutputTextAction
  | GeneratorImpulseAction;

const {
  IS_NEW_TEXT,
  IS_NOT_NEW_TEXT,
  UPDATE_SOURCE_FIELD,
  UPDATE_OUTPUT_FIELD,
  UPDATE_ORIGINAL_TEXT_PROMPT,
  UPDATE_ORIGINAL_TEXT_FIELD,
} = GeneratorAction;

const generatorReducer = (
  state: GeneratorParameters,
  action: GeneratorReducer
): GeneratorParameters => {
  switch (action.type) {
    case IS_NEW_TEXT:
      return { ...state, isNewText: true };
    case IS_NOT_NEW_TEXT:
      return { ...state, isNewText: false };
    case UPDATE_SOURCE_FIELD:
      return {
        ...state,
        canGenerateTextFromField: Boolean(action.sourceField && state.output.fieldId),
        sourceField: action.sourceField,
        originalText: { ...state.originalText, field: action.value },
      };
    case UPDATE_OUTPUT_FIELD:
      return {
        ...state,
        canGenerateTextFromField: Boolean(action.id && state.sourceField),
        output: {
          fieldId: action.id,
          fieldKey: action.key,
          locale: action.locale,
          validation: action.validation,
        },
      };
    case UPDATE_ORIGINAL_TEXT_PROMPT:
      return { ...state, originalText: { ...state.originalText, prompt: action.value } };
    case UPDATE_ORIGINAL_TEXT_FIELD:
      return { ...state, originalText: { ...state.originalText, field: action.value } };
    default:
      return state;
  }
};

export default generatorReducer;
