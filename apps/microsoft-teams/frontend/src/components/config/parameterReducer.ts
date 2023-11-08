import { AppInstallationParameters, Notification } from '@customTypes/configPage';
import { defaultNotification } from '@constants/defaultParams';

export enum actions {
  UPDATE_TENANT_ID = 'updateTenantId',
  UPDATE_NOTIFICATIONS = 'updateNotifications',
  ADD_NOTIFICATION = 'addNotification',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
}

type TenantIdAction = {
  type: actions.UPDATE_TENANT_ID;
  payload: string;
};

type NotificationsAction = {
  type: actions.UPDATE_NOTIFICATIONS;
  payload: Notification[];
};

type AddNotificationAction = {
  type: actions.ADD_NOTIFICATION;
};

type ApplyContentfulParametersAction = {
  type: actions.APPLY_CONTENTFUL_PARAMETERS;
  payload: AppInstallationParameters;
};

export type ParameterAction =
  | TenantIdAction
  | NotificationsAction
  | AddNotificationAction
  | ApplyContentfulParametersAction;

const { UPDATE_TENANT_ID, UPDATE_NOTIFICATIONS, ADD_NOTIFICATION, APPLY_CONTENTFUL_PARAMETERS } =
  actions;

const parameterReducer = (
  state: AppInstallationParameters,
  action: ParameterAction
): AppInstallationParameters => {
  switch (action.type) {
    case UPDATE_TENANT_ID:
      return {
        ...state,
        tenantId: action.payload,
      };
    case UPDATE_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
      };
    case ADD_NOTIFICATION: {
      return {
        ...state,
        notifications: [defaultNotification, ...state.notifications],
      };
    }
    case APPLY_CONTENTFUL_PARAMETERS: {
      const parameter = action.payload as AppInstallationParameters;
      return {
        ...state,
        tenantId: parameter.tenantId ?? '',
        notifications: parameter.notifications ?? [],
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
