import { useEffect, useState } from 'react';
import { BaseAppSDK } from '@contentful/app-sdk';
import { AppInstallationProps, KeyValueMap } from 'contentful-management';

export const useInstallationParameters = (
  sdk: BaseAppSDK
): {
  parameters: KeyValueMap;
  refetchInstallationParameters: () => Promise<void>;
} => {
  const [parameters, setParameters] = useState<KeyValueMap>(sdk.parameters.installation);

  useEffect(() => {
    const fetch = async () => {
      const newParameters = await fetchParameters(sdk);
      setParameters(newParameters);
    };
    fetch();
  }, [sdk]);

  const refetchInstallationParameters = async () => {
    const newParameters = await fetchParameters(sdk);
    setParameters(newParameters);
  };

  return { parameters: parameters ?? {}, refetchInstallationParameters };
};

const fetchParameters = async (sdk: BaseAppSDK): Promise<KeyValueMap> => {
  try {
    if (!sdk.ids.organization || !sdk.ids.app || !sdk.ids.space) {
      throw new Error('Required SDK IDs not available');
    }

    const appInstallation = await sdk.cma.appInstallation.getForOrganization({
      appDefinitionId: sdk.ids.app,
      organizationId: sdk.ids.organization,
    });

    const currentInstallation = appInstallation.items.find(
      (installation: AppInstallationProps) => installation.sys.space.sys.id === sdk.ids.space
    );

    if (currentInstallation?.parameters) {
      return currentInstallation.parameters as KeyValueMap;
    }
    return sdk.parameters.installation;
  } catch (error) {
    console.warn('Failed to fetch fresh parameters from CMA:', error);
  }

  return sdk.parameters.installation;
};
