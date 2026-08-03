import {
  PersistedInstallationParameters,
  parseEnabledFeatures,
} from '@components/config/appInstallationParameters';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { AIFeature } from '@configs/features/featureConfig';

/**
 * This hook is used to get the installation parameters from the sidebar location,
 * checks to see if there is a brand profile and returns the enabled features.
 *
 * @returns {hasBrandProfile, enabledFeatures}
 */
const useSidebarParameters = () => {
  const [hasBrandProfile, setHasBrandProfile] = useState(true);

  const sdk = useSDK<SidebarAppSDK<PersistedInstallationParameters>>();
  const installation = sdk.parameters.installation;
  const profile = installation.profile;
  // Dual-read enabledFeatures: new installs store it JSON-encoded as a Symbol,
  // pre-migration installs still have a real AIFeature[] array. Both resolve to
  // the customer's selection (falling back to all features when absent).
  const features = parseEnabledFeatures(
    installation.enabledFeatures as AIFeature[] | string | undefined
  );

  useEffect(() => {
    setHasBrandProfile(!!profile);
  }, [profile]);

  return {
    hasBrandProfile,
    enabledFeatures: features,
  };
};

export default useSidebarParameters;
