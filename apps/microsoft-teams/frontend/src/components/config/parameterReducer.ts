import { AppInstallationParameters, Notification } from '@customTypes/configPage';
import { defaultNotification } from '@constants/defaultParams';

export enum actions {
  UPDATE_MS_ACCOUNT_INFO = 'updateMsAccountInfo',
  UPDATE_NOTIFICATIONS = 'updateNotifications',
  ADD_NOTIFICATION = 'addNotification',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
}

type MsAccountInfoAction = {
  type: actions.UPDATE_MS_ACCOUNT_INFO;
  payload: Omit<AppInstallationParameters, 'notifications'>;
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
  | MsAccountInfoAction
  | NotificationsAction
  | AddNotificationAction
  | ApplyContentfulParametersAction;

const {
  UPDATE_MS_ACCOUNT_INFO,
  UPDATE_NOTIFICATIONS,
  ADD_NOTIFICATION,
  APPLY_CONTENTFUL_PARAMETERS,
} = actions;

const parameterReducer = (
  state: AppInstallationParameters,
  action: ParameterAction
): AppInstallationParameters => {
  switch (action.type) {
    case UPDATE_MS_ACCOUNT_INFO: {
      const msAccountInfo = action.payload;
      return {
        ...state,
        tenantId: msAccountInfo.tenantId,
        orgName: msAccountInfo.orgName,
        orgLogo: msAccountInfo.orgLogo,
        authenticatedUsername: msAccountInfo.authenticatedUsername,
      };
    }
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
      const parameters = action.payload;
      return {
        tenantId: parameters.tenantId ?? '',
        orgName: parameters.orgName ?? '',
        orgLogo: parameters.orgLogo ?? '',
        authenticatedUsername: parameters.authenticatedUsername ?? '',
        notifications: parameters.notifications ?? [],
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
