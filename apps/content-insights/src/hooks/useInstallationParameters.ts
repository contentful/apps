import { BaseAppSDK } from '@contentful/app-sdk';
import { AppInstallationParameters } from '../locations/ConfigScreen';

/**
 * Returns installation parameters directly from the SDK.
 *
 * Previously this hook made an expensive org-scoped CMA call
 * (`appInstallation.getForOrganization`) on every mount to re-fetch params.
 * That is unnecessary because `sdk.parameters.installation` already contains
 * the current installation parameters, and the extra call was contributing to
 * CMA rate-limit pressure (see INC-1276).
 *
 * The return shape `{ installation, refetchInstallationParameters }` is
 * preserved for backward compatibility; `refetchInstallationParameters` is now
 * a no-op.
 */
export const useInstallationParameters = (sdk: BaseAppSDK) => {
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;

  const refetchInstallationParameters = async () => {
    // No-op: parameters are read directly from the SDK at render time.
  };

  return { installation, refetchInstallationParameters };
};
