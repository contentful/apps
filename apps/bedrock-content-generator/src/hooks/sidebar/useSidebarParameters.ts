import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';

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
  // enabledFeatures is JSON-encoded as a Symbol string in the persisted shape.
  let parsedFeatures: AIFeature[] | undefined;
  try {
    parsedFeatures = installation.enabledFeatures
      ? JSON.parse(installation.enabledFeatures)
      : undefined;
  } catch {
    parsedFeatures = undefined;
  }

  useEffect(() => {
    setHasBrandProfile(!!profile);
  }, [profile]);

  // Default to all features if enabledFeatures is not set (for backward compatibility)
  const features =
    parsedFeatures && parsedFeatures.length > 0
      ? parsedFeatures
      : (Object.keys(featureConfig) as AIFeature[]);

  return {
    hasBrandProfile,
    enabledFeatures: features,
  };
};

export default useSidebarParameters;
