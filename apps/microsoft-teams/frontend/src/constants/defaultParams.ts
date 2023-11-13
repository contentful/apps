import { AppInstallationParameters, SelectedEvents } from '@customTypes/configPage';
import { AppEventKey } from './configCopy';

const initialParameters: AppInstallationParameters = {
  tenantId: '',
  notifications: [],
};

const getDefaultSelectedEvents = () => {
  const selectedEvents = {} as SelectedEvents;
  Object.values(AppEventKey).forEach((event) => {
    selectedEvents[event] = false;
  });
  return selectedEvents;
};

const defaultNotification = {
  channelId: '',
  contentTypeId: '',
  isEnabled: true,
  selectedEvents: getDefaultSelectedEvents(),
};

export { initialParameters, defaultNotification };
