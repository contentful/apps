import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
import { AIFeature } from '@configs/features/featureConfig';
import { DialogInvocationParameters } from '@locations/Dialog';

const init: {
  installation: PersistedInstallationParameters;
  invocation?: DialogInvocationParameters;
} = {
  installation: {
    model: '',
    profile: '',
  },
  invocation: {
    feature: AIFeature.TITLE,
    entryId: '',
    fieldLocales: {},
  },
};

export { init };
