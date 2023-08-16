import ConfigPage from '@components/config/config-page/ConfigPage';

interface AppInstallationParameters {
  model: string;
  apiKey: string;
  profile: { [key: string]: string };
}
const ConfigScreen = () => {
  return <ConfigPage />;
};

export default ConfigScreen;
export type { AppInstallationParameters };
