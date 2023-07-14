export enum GeneratorAction {
  LOCALE = 'updateLocale',
  TARGET_LOCALE = 'updateTargetLocale',
  IS_NEW_TEXT = 'isNewText',
  IS_NOT_NEW_TEXT = 'isNotNewText',
  SOURCE_FIELD = 'sourceField',
  OUTPUT_FIELD = 'outputField',
  ORIGINAL_TEXT = 'originalText',
}

export type GeneratorParameters = {
  locale: string;
  targetLocale: string;
  isNewText: boolean;
  sourceField: string;
  outputField: string;
  originalText: string;
};

type GeneratorStringActions = {
  type: Exclude<
    GeneratorAction,
    GeneratorAction.SOURCE_FIELD | GeneratorAction.IS_NEW_TEXT | GeneratorAction.IS_NOT_NEW_TEXT
  >;
  value: string;
};
type GeneratorSourceTextAction = {
  type: GeneratorAction.SOURCE_FIELD;
  field: string;
  value: string;
};
type GeneratorImpulseActions = {
  type: GeneratorAction.IS_NEW_TEXT | GeneratorAction.IS_NOT_NEW_TEXT;
};

export type GeneratorReducer =
  | GeneratorStringActions
  | GeneratorSourceTextAction
  | GeneratorImpulseActions;

const {
  LOCALE,
  TARGET_LOCALE,
  IS_NEW_TEXT,
  IS_NOT_NEW_TEXT,
  SOURCE_FIELD,
  OUTPUT_FIELD,
  ORIGINAL_TEXT,
} = GeneratorAction;
const generatorReducer = (state: GeneratorParameters, action: GeneratorReducer) => {
  switch (action.type) {
    case LOCALE:
      return { ...state, locale: action.value };
    case TARGET_LOCALE:
      return { ...state, targetLocale: action.value };
    case IS_NEW_TEXT:
      return { ...state, isNewText: true, originalText: '', generatedText: '' };
    case IS_NOT_NEW_TEXT:
      return { ...state, isNewText: false, originalText: '', generatedText: '' };
    case SOURCE_FIELD:
      return { ...state, sourceField: action.field, originalText: action.value };
    case OUTPUT_FIELD:
      return { ...state, outputField: action.value };
    case ORIGINAL_TEXT:
      return { ...state, originalText: action.value };
    default:
      return state;
  }
};

export default generatorReducer;
