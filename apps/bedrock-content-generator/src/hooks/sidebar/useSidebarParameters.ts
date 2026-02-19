import AppInstallationParameters from '@components/config/appInstallationParameters';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';

/**
 * This hook is used to get the installation parameters from the sidebar location,
 * checks to see if there is a brand profile, validates the API Key and returns any errors
 *
 * @returns {hasBrandProfile, enabledFeatures}
 */
const useSidebarParameters = () => {
  const [hasBrandProfile, setHasBrandProfile] = useState(true);

  const sdk = useSDK<SidebarAppSDK<AppInstallationParameters>>();
  const { profile, enabledFeatures } = sdk.parameters.installation;

  useEffect(() => {
    setHasBrandProfile(!!profile);
  }, [profile]);

  // Default to all features if enabledFeatures is not set (for backward compatibility)
  const features =
    enabledFeatures && enabledFeatures.length > 0
      ? enabledFeatures
      : (Object.keys(featureConfig) as AIFeature[]);

  return {
    hasBrandProfile,
    enabledFeatures: features,
  };
};

export default useSidebarParameters;
