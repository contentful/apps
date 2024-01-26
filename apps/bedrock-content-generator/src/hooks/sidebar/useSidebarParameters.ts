import AppInstallationParameters from "@components/config/appInstallationParameters";
import { SidebarAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { useEffect, useState } from "react";

/**
 * This hook is used to get the installation parameters from the sidebar location,
 * checks to see if there is a brand profile, validates the API Key and returns any errors
 *
 * @returns {hasBrandProfile, apiError}
 */
const useSidebarParameters = () => {
  const [hasBrandProfile, setHasBrandProfile] = useState(true);

  const sdk = useSDK<SidebarAppSDK<AppInstallationParameters>>();
  const { profile } = sdk.parameters.installation;

  useEffect(() => {
    setHasBrandProfile(!!profile);
  }, [profile]);

  return {
    hasBrandProfile,
  };
};

export default useSidebarParameters;
