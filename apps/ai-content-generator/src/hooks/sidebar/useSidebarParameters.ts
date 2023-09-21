import { useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import AI from '@utils/aiApi';
import { modelsBaseUrl } from '@configs/ai/baseUrl';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { AiApiError, AiApiErrorType } from '@utils/aiApi/handleAiApiErrors';

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
  const { key, profile } = sdk.parameters.installation;

  useEffect(() => {
    const validateApiKey = async () => {
      const ai = new AI(modelsBaseUrl, key);
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

    validateApiKey();
    setHasBrandProfile(!!profile);
  }, [key, profile]);

  return {
    hasBrandProfile,
    apiError,
  };
};

export default useSidebarParameters;
