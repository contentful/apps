import { BaseAppSDK } from '@contentful/app-sdk';

// TODO: remove these types once the SDK is updated with the new user consent types
export declare const ACCEPT = 'ACCEPT';
export declare const DENY = 'DENY';
declare type ConsentRecordKey =
  | 'ANALYTICS'
  | 'ESSENTIAL'
  | 'MARKETING'
  | 'PERSONALIZATION'
  | 'OPT_OUT'
  | 'STORAGE';

declare type ConsentData = {
  uuid: string;
  expirationDate: string | null;
  consentRecord: Record<ConsentRecordKey, 'ACCEPT' | 'DENY'>;
  rawConsentRecord: string;
};
export interface UserConsent {
  [key: string]: ConsentData;
}

export function getUserCookieConsent(sdk: BaseAppSDK, consentProperty: ConsentRecordKey) {
  // TODO: remove ts-ignore once the SDK is updated with the new user consent types
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const consentRecord: UserConsent = sdk.user?.consentRecord;
  return consentRecord?.userInterface?.consentRecord[consentProperty] === 'ACCEPT';
}
