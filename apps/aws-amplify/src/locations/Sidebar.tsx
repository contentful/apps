import { Paragraph, Button } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const cma = useCMA();
  const [isLoading] = useState(false);

  const handleBuildAppActionCall = async () => {
    try {
      const res = await cma.appActionCall.createWithResponse(
        {
          appActionId: 'example',
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
      console.log({ res });
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
        {isLoading ? 'Building' : 'Build website'}
      </Button>
    </Paragraph>
  );
};

export default Sidebar;
