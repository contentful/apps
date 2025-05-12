import logger from '../utils/logger';

// Use a consistent storage key across all components
export const STORAGE_KEY = 'klaviyo_field_mappings';
export const APP_DEF_ID_KEY = 'appDefinitionId';

/**
 * Store app definition ID for later use
 */
export const storeAppDefinitionId = (appDefinitionId: string): void => {
  try {
    if (appDefinitionId) {
      localStorage.setItem(APP_DEF_ID_KEY, appDefinitionId);
      logger.log('[persistence] Stored app definition ID:', appDefinitionId);
    }
  } catch (e) {
    logger.error('[persistence] Error storing app definition ID:', e);
  }
};

/**
 * Get stored app definition ID
 */
export const getAppDefinitionId = (): string | null => {
  return localStorage.getItem(APP_DEF_ID_KEY);
};
