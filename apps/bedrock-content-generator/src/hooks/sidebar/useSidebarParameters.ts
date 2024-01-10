import AppInstallationParameters from "@components/config/appInstallationParameters";
import { SidebarAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import AI from "@utils/aiApi";
import { AiApiError, AiApiErrorType } from "@utils/aiApi/handleAiApiErrors";
import { useEffect, useState } from "react";

/**
 * This hook is used to get the installation parameters from the sidebar location,
 * checks to see if there is a brand profile, validates the API Key and returns any errors
 *
 * @returns {hasBrandProfile, apiError}
 */
const useSidebarParameters = () => {
  const [apiError, setApiError] = useState<AiApiErrorType>();
  const [hasBrandProfile, setHasBrandProfile] = useState(true);

  const sdk = useSDK<SidebarAppSDK<AppInstallationParameters>>();
  const { accessKeyId, secretAccessKey, profile, region } =
    sdk.parameters.installation;

  useEffect(() => {
    console.log(sdk.parameters.installation);

    const validateCredentials = async () => {
      const ai = new AI(accessKeyId, secretAccessKey, region);
      try {
        await ai.getModels();
      } catch (e: unknown) {
        console.error(e);
        if (e instanceof AiApiError) {
          setApiError(e);
        } else {
          setApiError(new AiApiError({}));
        }
      }
    };

    validateCredentials();
    setHasBrandProfile(!!profile);
  }, [accessKeyId, secretAccessKey, profile]);

  return {
    hasBrandProfile,
    apiError,
  };
};

export default useSidebarParameters;
