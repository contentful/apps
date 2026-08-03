import { SegmentAppData } from '@configs/segment/segmentEvent';
import { BaseAppSDK } from '@contentful/app-sdk';
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';

const getTrackedAppData = (sdk: BaseAppSDK<PersistedInstallationParameters>): SegmentAppData => {
  const { installation } = sdk.parameters;

  return {
    gpt_model: installation?.model || '',

    config_options: {
      has_profile: !!installation?.profile,
      has_values: !!installation?.values,
      has_tone: !!installation?.tone,
      has_exclude: !!installation?.exclude,
      has_include: !!installation?.include,
      has_audience: !!installation?.audience,
      has_additional: !!installation?.additional,
    },
  };
};

export default getTrackedAppData;
