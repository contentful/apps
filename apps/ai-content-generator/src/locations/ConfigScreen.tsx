import ConfigForm from '@components/config/ConfigForm';

interface AppInstallationParameters {
  model: string;
  apiKey: string;
  profile: string;
}

const ConfigScreen = () => {
  return <ConfigForm />;
};

export default ConfigScreen;
export type { AppInstallationParameters };
