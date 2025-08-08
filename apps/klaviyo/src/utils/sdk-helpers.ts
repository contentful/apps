import { ConfigAppSDK } from '@contentful/app-sdk';
import { logger } from './logger';

// The key used to store the app definition ID in localStorage
const RETRY_DELAY = 500; // ms
const MAX_RETRIES = 3;

/**
 * Get the global SDK with retry logic
 * @param retries Number of retries remaining
 * @returns A promise that resolves to the SDK or null if unavailable
 */
export const getGlobalSDK = async (retries = MAX_RETRIES): Promise<any | null> => {
  const globalSdk = (window as any).sdk;

  if (
    globalSdk &&
    globalSdk.ids &&
    globalSdk.ids.app &&
    globalSdk.ids.space &&
    globalSdk.ids.environment
  ) {
    return globalSdk;
  }

  if (retries <= 0) {
    logger.warn('[sdk-helpers] Global SDK not fully available after retries');
    return null;
  }

  // Wait and retry
  return new Promise((resolve) => {
    setTimeout(() => {
      getGlobalSDK(retries - 1).then(resolve);
    }, RETRY_DELAY);
  });
};

const APP_ORGANIZATION_ID = '5EJGHo8tYJcjnEhYWDxivp';
const APP_DEFINITION_ID = '2x4lsvuxPAGS2UUHwWVYee';

export const getOrgIdForSdk = (sdk: ConfigAppSDK) => {
  const isMarketplaceVersion = sdk.ids.app === APP_DEFINITION_ID;
  return isMarketplaceVersion ? APP_ORGANIZATION_ID : sdk.ids.organization;
};
