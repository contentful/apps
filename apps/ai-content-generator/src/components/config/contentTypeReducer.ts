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

const contentTypeReducer = (state: Set<string>, action: ContentTypeReducer) => {
  switch (action.type) {
    case ADD:
      state.add(action.value);
      return new Set(state);
    case REMOVE:
      state.delete(action.value);
      return new Set(state);
    case ADD_ALL:
      return new Set(action.value);
    case REMOVE_ALL:
      state.clear();
      return new Set(state);
    default:
      return state;
  }
};

export default contentTypeReducer;
