import { AIFeature } from '@configs/features/featureConfig';

interface AppInstallationParameters {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  model: string;
  profile: string;
  brandProfile: ProfileType;
  enabledFeatures?: AIFeature[];
}

export enum ProfileFields {
  PROFILE = 'profile',
  VALUES = 'values',
  TONE = 'tone',
  EXCLUDE = 'exclude',
  INCLUDE = 'include',
  AUDIENCE = 'audience',
  ADDITIONAL = 'additional',
}

export type ProfileType = {
  [K in ProfileFields]?: string;
};

export default AppInstallationParameters;
