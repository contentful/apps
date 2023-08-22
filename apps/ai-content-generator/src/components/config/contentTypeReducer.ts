import { ContentTypeProps } from 'contentful-management';

export enum ContentTypeAction {
  ADD = 'add',
  REMOVE = 'remove',
  ADD_ALL = 'addAll',
  REMOVE_ALL = 'removeAll',
}

type ContentTypeActions = {
  type: Exclude<ContentTypeAction, ContentTypeAction.REMOVE_ALL | ContentTypeAction.ADD_ALL>;
  value: ContentTypeProps;
};

type ContentTypeAddAllAction = {
  type: ContentTypeAction.ADD_ALL;
  value: { [key: string]: ContentTypeProps };
};

type ContentTypeRemoveAllAction = {
  type: ContentTypeAction.REMOVE_ALL;
};

export type ContentTypeReducer =
  | ContentTypeActions
  | ContentTypeAddAllAction
  | ContentTypeRemoveAllAction;

const { ADD, REMOVE, ADD_ALL, REMOVE_ALL } = ContentTypeAction;

const contentTypeReducer = (
  state: { [key: string]: ContentTypeProps },
  action: ContentTypeReducer
) => {
  switch (action.type) {
    case ADD:
      if (state[action.value.sys.id]) {
        return state;
      } else {
        return { ...state, [action.value.sys.id]: action.value };
      }
    case REMOVE:
      if (state[action.value.sys.id]) {
        const newState = { ...state };
        delete newState[action.value.sys.id];
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
