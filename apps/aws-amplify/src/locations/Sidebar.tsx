import { useEffect, useState } from 'react';
import { Button, Paragraph } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { getItemLocalStorage, build_status_key, setItemLocalStorage } from '../lib/localStorage';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const cma = useCMA();
  const [isLoading, setIsLoading] = useState(false);
  const [lastBuildInitiated, setLastBuildInitiated] = useState(
    getItemLocalStorage(build_status_key) || null
  );

  useEffect(() => {
    if (lastBuildInitiated) {
      setLastBuildInitiated(lastBuildInitiated);
    }
  }, [lastBuildInitiated]);

  const handleBuildAppActionCall = async () => {
    const buildInitiated = new Date().toLocaleTimeString();
    setIsLoading(true);
    try {
      const res = await cma.appActionCall.createWithResponse(
        {
          appActionId: 'amplifyBuildAction',
          environmentId: sdk.ids.environment,
          spaceId: sdk.ids.space,
          appDefinitionId: sdk.ids.app!,
        },
        {
          parameters: {
            amplifyWebhookUrl: sdk.parameters.installation.amplifyWebhookUrl,
          },
        }
      );
      setLastBuildInitiated(buildInitiated);
      setItemLocalStorage(build_status_key, buildInitiated);
      setIsLoading(false);
      const { message } = JSON.parse(res.response.body);
      sdk.notifier.success(message);
    } catch (err) {
      console.log({ err });
    }
  };

  return (
    <Paragraph>
      <Button
        variant="primary"
        isFullWidth={true}
        isLoading={isLoading}
        isDisabled={isLoading}
        onClick={handleBuildAppActionCall}>
        {isLoading ? 'Initiating build...' : 'Build now'}
      </Button>
      <span>Last build started: {lastBuildInitiated}</span>
    </Paragraph>
  );
};

export default Sidebar;
