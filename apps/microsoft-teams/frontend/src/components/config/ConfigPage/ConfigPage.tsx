import { ChangeEvent } from 'react';
import { AppInstallationParameters } from '@customTypes/configPage';
import AccessSection from '@components/config/AccessSection/AccessSection';
import NotificationsSection from '@components/config/NotificationsSection/NotificationsSection';

interface Props {
  handleConfig: (value: AppInstallationParameters) => void;
  parameters: AppInstallationParameters;
}

const ConfigPage = (props: Props) => {
  const { handleConfig, parameters } = props;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleConfig({ tenantId: e.target.value });
  };

  const createNewNotification = () => {
    const currentNotifications = parameters.notifications ?? [];
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

    handleConfig({
      notifications: [defaultNotification, ...currentNotifications],
    });
  };

  return (
    <>
      <AccessSection tenantId={parameters.tenantId ?? ''} handleChange={handleChange} />
      <NotificationsSection
        notifications={parameters.notifications ?? []}
        createNewNotification={createNewNotification}
      />
    </>
  );
};

export default ConfigPage;
