import ConfigPage from '@components/config/config-page/ConfigPage';
import { ProfileFields } from '@components/config/configText';

export type ProfileType = {
  [K in ProfileFields]?: string;
};
interface AppInstallationParameters {
  // Model is optional since V1 of the config page didn't save model as a param if you had the default selected.
  model?: string;
  key: string;
  profile: string;
  // Optional since we are accessing properties on this object
  brandProfile?: ProfileType;
}

const ConfigScreen = () => {
  return <ConfigPage />;
};

export default ConfigScreen;
export type { AppInstallationParameters };
