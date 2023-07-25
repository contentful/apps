export enum GeneratorAction {
  UPDATE_LOCALE = 'updateLocale',
  UPDATE_TARGET_LOCALE = 'updateTargetLocale',
  IS_NEW_TEXT = 'isNewText',
  IS_NOT_NEW_TEXT = 'isNotNewText',
  UPDATE_SOURCE_FIELD = 'changeSourceField',
  UPDATE_OUTPUT_FIELD = 'changeOutputField',
  UPDATE_ORIGINAL_TEXT = 'changeOriginalText',
  CAN_GENERATE_TEXT_FROM_FIELD = 'canGenerateTextFromField',
}

export type GeneratorParameters = {
  locale: string;
  targetLocale: string;
  isNewText: boolean;
  // can generate text from field when both source and output fields are selected
  canGenerateTextFromField: boolean;
  sourceField: string;
  outputField: string;
  originalText: string;
};

type GeneratorStringActions = {
  type: Exclude<
    GeneratorAction,
    | GeneratorAction.UPDATE_SOURCE_FIELD
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
type GeneratorImpulseActions = {
  type:
    | GeneratorAction.IS_NEW_TEXT
    | GeneratorAction.IS_NOT_NEW_TEXT
    | GeneratorAction.CAN_GENERATE_TEXT_FROM_FIELD;
};

export type GeneratorReducer =
  | GeneratorStringActions
  | GeneratorSourceTextAction
  | GeneratorImpulseActions;

const {
  UPDATE_LOCALE,
  UPDATE_TARGET_LOCALE,
  IS_NEW_TEXT,
  IS_NOT_NEW_TEXT,
  UPDATE_SOURCE_FIELD,
  UPDATE_OUTPUT_FIELD,
  UPDATE_ORIGINAL_TEXT,
  CAN_GENERATE_TEXT_FROM_FIELD,
} = GeneratorAction;
const generatorReducer = (state: GeneratorParameters, action: GeneratorReducer) => {
  switch (action.type) {
    case UPDATE_LOCALE:
      return { ...state, locale: action.value };
    case UPDATE_TARGET_LOCALE:
      return { ...state, targetLocale: action.value };
    case IS_NEW_TEXT:
      return { ...state, isNewText: true, originalText: '', generatedText: '' };
    case IS_NOT_NEW_TEXT:
      return { ...state, isNewText: false, originalText: '', generatedText: '' };
    case CAN_GENERATE_TEXT_FROM_FIELD:
      return { ...state, canGenerateTextFromField: true, originalText: '', generatedText: '' };
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
        outputField: action.value,
        canGenerateTextFromField: Boolean(action.value && state.sourceField),
      };
    case UPDATE_ORIGINAL_TEXT:
      return { ...state, originalText: action.value };
    default:
      return state;
  }
};

export default generatorReducer;
