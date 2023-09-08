import ConfigPage from '@components/config/config-page/ConfigPage';
import { ProfileFields } from '@components/config/configText';

export type ProfileType = {
  [K in ProfileFields]?: string;
};
interface AppInstallationParameters {
  model: string;
  apiKey: string;
  profile: ProfileType;
  version: number;
}

const ConfigScreen = () => {
  return <ConfigPage />;
};

export default ConfigScreen;
export type { AppInstallationParameters };
