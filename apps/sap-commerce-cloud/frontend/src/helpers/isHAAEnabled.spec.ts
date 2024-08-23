import { BaseAppSDK } from '@contentful/app-sdk';
import { isHAAEnabled } from './isHAAEnabled';

describe('isHAAEnabled', () => {
  it('should return true if the app id is the same as the SAP Air app id', () => {
    const ids = {
      app: 'TEST_SAP_AIR_APP_ID',
    };
    expect(isHAAEnabled(ids as BaseAppSDK['ids'])).toBe(true);
  });

  it('should return false if the app id is not the same as the SAP Air app id', () => {
    const ids = {
      app: 'TEST_SAP_APP_ID',
    };
    expect(isHAAEnabled(ids as BaseAppSDK['ids'])).toBe(false);
  });
});
