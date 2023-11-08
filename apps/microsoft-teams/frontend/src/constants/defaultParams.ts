import { AppInstallationParameters } from '@customTypes/configPage';

const initialParameters: AppInstallationParameters = {
  tenantId: '',
  notifications: [],
};

const defaultNotification = {
  channelId: '',
  contentTypeId: '',
  isEnabled: true,
  selectedEvents: {
    publish: false,
    unpublish: false,
    create: false,
    delete: false,
    edit: false,
  },
};

export { initialParameters, defaultNotification };
