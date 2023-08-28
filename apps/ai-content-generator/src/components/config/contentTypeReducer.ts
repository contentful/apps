export enum ContentTypeAction {
  ADD = 'add',
  REMOVE = 'remove',
  ADD_ALL = 'addAll',
  REMOVE_ALL = 'removeAll',
}

type ContentTypeActions = {
  type: Exclude<ContentTypeAction, ContentTypeAction.REMOVE_ALL | ContentTypeAction.ADD_ALL>;
  value: string;
};

type ContentTypeAddAllAction = {
  type: ContentTypeAction.ADD_ALL;
  value: string[];
};

type ContentTypeRemoveAllAction = {
  type: ContentTypeAction.REMOVE_ALL;
};

export type ContentTypeReducer =
  | ContentTypeActions
  | ContentTypeAddAllAction
  | ContentTypeRemoveAllAction;

const { ADD, REMOVE, ADD_ALL, REMOVE_ALL } = ContentTypeAction;

const contentTypeReducer = (state: string[], action: ContentTypeReducer) => {
  switch (action.type) {
    case ADD:
      return [...state, action.value];
    case REMOVE:
      return state.filter((ct) => ct !== action.value);
    case ADD_ALL:
      return action.value;
    case REMOVE_ALL:
      return [];
    default:
      return state;
  }
};

export default contentTypeReducer;
