import { logger } from './logger';

// The key used to store the app definition ID in localStorage
const APP_DEF_ID_KEY = 'appDefinitionId';
const RETRY_DELAY = 500; // ms
const MAX_RETRIES = 3;

/**
 * Store the app definition ID in localStorage for later use
 */
export const storeAppDefinitionId = (appDefinitionId: string): void => {
  try {
    if (appDefinitionId) {
      localStorage.setItem(APP_DEF_ID_KEY, appDefinitionId);
      logger.log('[sdk-helpers] Stored app definition ID:', appDefinitionId);
    }
  } catch (e) {
    logger.error('[sdk-helpers] Error storing app definition ID:', e);
  }
};

/**
 * Get the stored app definition ID from localStorage
 */
export const getAppDefinitionId = (): string | null => {
  return localStorage.getItem(APP_DEF_ID_KEY);
};

/**
 * Check if the global SDK is available and properly initialized
 */
export const isSDKAvailable = (): boolean => {
  const globalSdk = (window as any).sdk;
  return (
    !!globalSdk &&
    !!globalSdk.ids &&
    !!globalSdk.ids.app &&
    !!globalSdk.ids.space &&
    !!globalSdk.ids.environment
  );
};

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

/**
 * Ensure app parameters are initialized with all required components
 * @param sdk Contentful SDK instance
 */
export const ensureAppParameters = async (sdk: any): Promise<void> => {
  try {
    if (!sdk || !sdk.app) {
      logger.warn('[sdk-helpers] SDK or SDK.app not available for parameters');
      return;
    }

    const parameters = await sdk.app.getParameters();

    // If we already have parameters, no need to initialize
    if (parameters && parameters.installation) {
      return;
    }

    // Initialize with empty structure if missing
    await sdk.app.setParameters({
      installation: {
        fieldMappings: [],
      },
    });

    logger.log('[sdk-helpers] Initialized app parameters with empty structure');
  } catch (error) {
    logger.error('[sdk-helpers] Error ensuring app parameters:', error);
  }
};
