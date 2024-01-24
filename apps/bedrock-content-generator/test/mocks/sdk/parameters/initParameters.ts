import AppInstallationParameters from "@components/config/appInstallationParameters";
import { AIFeature } from "@configs/features/featureConfig";
import { DialogInvocationParameters } from "@locations/Dialog";

const init: {
  installation: AppInstallationParameters;
  invocation?: DialogInvocationParameters;
} = {
  installation: {
    model: "",
    profile: "",
    brandProfile: {},
    accessKeyId: "",
    secretAccessKey: "",
    region: "",
  },
  invocation: {
    feature: AIFeature.TITLE,
    entryId: "",
    fieldLocales: {},
  },
};

export { init };
