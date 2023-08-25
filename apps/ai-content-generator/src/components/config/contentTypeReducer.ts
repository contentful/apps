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
  value: { [key: string]: boolean };
};

type ContentTypeRemoveAllAction = {
  type: ContentTypeAction.REMOVE_ALL;
};

export type ContentTypeReducer =
  | ContentTypeActions
  | ContentTypeAddAllAction
  | ContentTypeRemoveAllAction;

const { ADD, REMOVE, ADD_ALL, REMOVE_ALL } = ContentTypeAction;

const contentTypeReducer = (state: { [key: string]: boolean }, action: ContentTypeReducer) => {
  switch (action.type) {
    case ADD:
      if (state[action.value]) {
        return state;
      } else {
        return { ...state, [action.value]: true };
      }
    case REMOVE:
      if (state[action.value]) {
        const newState = { ...state };
        delete newState[action.value];
        return { ...newState };
      } else {
        return state;
      }
    case ADD_ALL:
      return action.value;
    case REMOVE_ALL:
      return {};
    default:
      return state;
  }
};

export default contentTypeReducer;
