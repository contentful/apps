import { describe, it, expect } from 'vitest';
import { getUserCookieConsent } from './cookieConsent';
import { BaseAppSDK } from '@contentful/app-sdk';

const sdk = {
  user: {
    consentRecord: {
      userInterface: {
        consentRecord: {
          STORAGE: 'ACCEPT',
        },
      },
    },
  },
} as unknown as BaseAppSDK;

describe('getUserCookieConsent', () => {
  it('should return true if it exists', () => {
    expect(getUserCookieConsent(sdk, 'STORAGE')).toBeTruthy();
  });

  it('should return false if it does not exist', () => {
    expect(getUserCookieConsent(sdk, 'ANALYTICS')).toBeFalsy();
  });
});
