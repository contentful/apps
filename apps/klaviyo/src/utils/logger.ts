/**
 * Production-safe logger utility
 * This utility wraps console methods to only show logs in development mode
 * or when explicitly enabled via localStorage
 */

// Allow debugging in production by setting this in localStorage
const DEBUG_KEY = 'klaviyo_debug_enabled';

/**
 * Check if debug logging is enabled
 * @returns boolean
 */
const isDebugEnabled = (): boolean => {
  // Always enable debugging in development
  if (import.meta.env.MODE !== 'production') {
    return true;
  }

  // Check if explicitly enabled via localStorage
  try {
    return localStorage.getItem(DEBUG_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

/**
 * Enable debug logging (in production)
 */
export const enableDebugLogging = (): void => {
  try {
    localStorage.setItem(DEBUG_KEY, 'true');
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Disable debug logging
 */
export const disableDebugLogging = (): void => {
  try {
    localStorage.removeItem(DEBUG_KEY);
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Logger object with production-safe methods
 */
export const logger = {
  /**
   * Log informational message (only in development or debug mode)
   */
  log: (...args: any[]): void => {
    if (isDebugEnabled()) {
      console.log(...args);
    }
  },

  /**
   * Log warning message (only in development or debug mode)
   */
  warn: (...args: any[]): void => {
    if (isDebugEnabled()) {
      console.warn(...args);
    }
  },

  /**
   * Log error message (always shown)
   * Critical errors should always be logged
   */
  error: (...args: any[]): void => {
    console.error(...args);
  },
};

export default logger;
