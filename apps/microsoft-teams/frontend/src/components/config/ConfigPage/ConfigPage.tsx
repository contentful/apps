import { ChangeEvent } from 'react';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import AccessSection from '@components/config/AccessSection/AccessSection';
import NotificationsSection from '@components/config/NotificationsSection/NotificationsSection';

interface ParameterObject {
  [key: string]: string;
}

interface Props {
  handleConfig: (value: ParameterObject) => void;
  parameters: AppInstallationParameters;
}

const ConfigPage = (props: Props) => {
  const { handleConfig, parameters } = props;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleConfig({ tenantId: e.target.value });
  };

  return (
    <>
      <AccessSection tenantId={parameters.tenantId ?? ''} handleChange={handleChange} />
      <NotificationsSection />
    </>
  );
};

export default ConfigPage;
