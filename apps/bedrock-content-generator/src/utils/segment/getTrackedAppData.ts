import { SegmentAppData } from '@configs/segment/segmentEvent';
import { BaseAppSDK } from '@contentful/app-sdk';
import AppInstallationParameters from '@components/config/appInstallationParameters';

const getTrackedAppData = (sdk: BaseAppSDK<AppInstallationParameters>): SegmentAppData => {
  const { installation } = sdk.parameters;

  return {
    gpt_model: installation?.model || '',

    config_options: {
      has_profile: !!installation?.profile,
      has_values: !!installation?.brandProfile?.values,
      has_tone: !!installation?.brandProfile?.tone,
      has_exclude: !!installation?.brandProfile?.exclude,
      has_include: !!installation?.brandProfile?.include,
      has_audience: !!installation?.brandProfile?.audience,
      has_additional: !!installation?.brandProfile?.additional,
    },
  };
};

export default getTrackedAppData;
