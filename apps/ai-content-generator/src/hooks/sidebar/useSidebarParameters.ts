import { useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';

/**
 * This hook is used to get the installation parameters from the sidebar location,
 * checks to see if there is a brand profile and returns it.
 *
 * @returns {hasBrandProfile}
 */
const useSidebarParameters = () => {
  const [hasBrandProfile, setHasBrandProfile] = useState(true);

  const sdk = useSDK<SidebarAppSDK<PersistedInstallationParameters>>();
  const { profile } = sdk.parameters.installation;

  useEffect(() => {
    setHasBrandProfile(!!profile);
  }, [profile]);

  return {
    hasBrandProfile,
  };
};

export default useSidebarParameters;
