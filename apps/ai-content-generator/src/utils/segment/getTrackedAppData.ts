import { SegmentAppData } from '@configs/segment/segmentEvent';
import { BaseAppSDK } from '@contentful/app-sdk';
import { AppInstallationParameters } from '@locations/ConfigScreen';

const getTrackedAppData = (sdk: BaseAppSDK<AppInstallationParameters>): SegmentAppData => {
  const { installation } = sdk.parameters;

  return {
    gptModel: installation?.model,

    // Brand Profile
    profile: !!installation?.profile,
    values: !!installation?.brandProfile?.values,
    tone: !!installation?.brandProfile?.tone,
    exclude: !!installation?.brandProfile?.exclude,
    include: !!installation?.brandProfile?.include,
    audience: !!installation?.brandProfile?.audience,
    additional: !!installation?.brandProfile?.additional,
  };
};

export default getTrackedAppData;
