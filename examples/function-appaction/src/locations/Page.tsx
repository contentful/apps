import { PageAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppActionProps, CollectionProp } from 'contentful-management';
import { useMemo, useState } from 'react';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [appActions, setAppActions] = useState<CollectionProp<AppActionProps>>();

  useMemo(async () => {
    setAppActions(
      await sdk.cma.appAction.getMany({
        organizationId: sdk.ids.organization,
        appDefinitionId: sdk.ids.app || '',
      })
    );
  }, [sdk]);

  const handleAction = async (action: AppActionProps) => {
    const result = await sdk.cma.appActionCall.createWithResponse(
      {
        organizationId: sdk.ids.organization,
        appDefinitionId: sdk.ids.app || '',
        appActionId: action.sys.id,
      },
      {
        parameters: {
          foo: 'bar',
        },
      }
    );
    console.log(result);
  };

  return (
    <>
      <h1>App Actions</h1>
      {appActions?.items.map((action) => (
        <Button key={action.sys.id} onClick={() => handleAction(action)}>
          {action.name}
        </Button>
      ))}
    </>
  );
};

export default Page;
