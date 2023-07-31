export enum GeneratorAction {
  IS_NEW_TEXT = 'isNewText',
  IS_NOT_NEW_TEXT = 'isNotNewText',
  UPDATE_SOURCE_FIELD = 'changeSourceField',
  UPDATE_OUTPUT_FIELD = 'changeOutputField',
  UPDATE_ORIGINAL_TEXT = 'changeOriginalText',
  CAN_GENERATE_TEXT_FROM_FIELD = 'canGenerateTextFromField',
}

export type GeneratorParameters = {
  isNewText: boolean;
  // can generate text from field when both source and output fields are selected
  canGenerateTextFromField: boolean;
  sourceField: string;
  outputField: string;
  outputFieldId: string;
  outputFieldLocale: string;
  originalText: string;
};

type GeneratorStringActions = {
  type: Exclude<
    GeneratorAction,
    | GeneratorAction.UPDATE_SOURCE_FIELD
    | GeneratorAction.UPDATE_OUTPUT_FIELD
    | GeneratorAction.IS_NEW_TEXT
    | GeneratorAction.IS_NOT_NEW_TEXT
  >;
  value: string;
};

type GeneratorSourceTextAction = {
  type: GeneratorAction.UPDATE_SOURCE_FIELD;
  field: string;
  value: string;
};

type GeneratorOutputTextAction = {
  type: GeneratorAction.UPDATE_OUTPUT_FIELD;
  field: string;
  id: string;
  locale: string;
};

type GeneratorImpulseActions = {
  type:
    | GeneratorAction.IS_NEW_TEXT
    | GeneratorAction.IS_NOT_NEW_TEXT
    | GeneratorAction.CAN_GENERATE_TEXT_FROM_FIELD;
};

export type GeneratorReducer =
  | GeneratorStringActions
  | GeneratorSourceTextAction
  | GeneratorOutputTextAction
  | GeneratorImpulseActions;

const {
  IS_NEW_TEXT,
  IS_NOT_NEW_TEXT,
  UPDATE_SOURCE_FIELD,
  UPDATE_OUTPUT_FIELD,
  UPDATE_ORIGINAL_TEXT,
  CAN_GENERATE_TEXT_FROM_FIELD,
} = GeneratorAction;
const generatorReducer = (state: GeneratorParameters, action: GeneratorReducer) => {
  switch (action.type) {
    case IS_NEW_TEXT:
      return { ...state, isNewText: true, originalText: '', generatedText: '' };
    case IS_NOT_NEW_TEXT:
      return { ...state, isNewText: false, originalText: '', generatedText: '' };
    case UPDATE_SOURCE_FIELD:
      return {
        ...state,
        sourceField: action.field,
        canGenerateTextFromField: Boolean(action.field && state.outputField),
        originalText: action.value,
      };
    case UPDATE_OUTPUT_FIELD:
      return {
        ...state,
        outputField: action.field,
        outputFieldId: action.id,
        outputFieldLocale: action.locale,
        canGenerateTextFromField: Boolean(action.field && state.sourceField),
      };
    case UPDATE_ORIGINAL_TEXT:
      return { ...state, originalText: action.value };
    default:
      return state;
  }
};

export default generatorReducer;
