import ConfigPage from '@components/config/config-page/ConfigPage';
import { ProfileFields } from '@components/config/configText';

export type ProfileType = {
  [K in ProfileFields]?: string;
};

/**
 * Edit this to extend whatever the current parameter version is.
 * This allows us to update the entire app's parameter types in one place
 */
interface AppInstallationParameters extends AppInstallationParametersV2 {}

interface AppInstallationParametersV2 {
  model: string;
  apiKey: string;
  profile: ProfileType;
  version: number;
}

interface AppInstallationParametersV1 {
  model: string;
  key: string;
  profile: string;
}

const ConfigScreen = () => {
  return <ConfigPage />;
};

export default ConfigScreen;
export type { AppInstallationParameters, AppInstallationParametersV1, AppInstallationParametersV2 };
