import ConfigPage from '@components/config/config-page/ConfigPage';
import { ProfileFields } from '@components/config/configText';

export type ProfileType = {
  [K in ProfileFields]?: string;
};
interface AppInstallationParameters {
  model: string;
  key: string;
  profile: string;
  brandProfile: ProfileType;
}

const ConfigScreen = () => {
  return <ConfigPage />;
};

export default ConfigScreen;
export type { AppInstallationParameters };
