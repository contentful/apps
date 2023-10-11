import { describe, it, expect } from 'vitest';
import getTrackedAppData from './getTrackedAppData';
import { BaseAppSDK } from '@contentful/app-sdk';
import AppInstallationParameters from '@components/config/appInstallationParameters';

const sdk = {
  parameters: {
    installation: {
      key: 'key',
      model: 'model',
      profile: 'profile',
      brandProfile: {
        values: 'values',
        tone: 'tone',
        exclude: 'exclude',
        include: '',
        audience: 'audience',
        additional: '',
      },
    },
  },
} as unknown as BaseAppSDK<AppInstallationParameters>;

describe('getTrackedAppData', () => {
  it('should return the correct data', () => {
    const result = getTrackedAppData(sdk);
    expect(result).toEqual({
      gpt_model: 'model',
      config_options: {
        has_profile: true,
        has_values: true,
        has_tone: true,
        has_exclude: true,
        has_include: false,
        has_audience: true,
        has_additional: false,
      },
    });
  });
});
