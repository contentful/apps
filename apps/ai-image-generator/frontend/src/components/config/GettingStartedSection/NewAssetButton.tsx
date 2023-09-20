import { KnownAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

const NewAssetButton = () => {
  const sdk = useSDK<KnownAppSDK>();

  return (
    <Button
      isFullWidth
      variant="primary"
      onClick={async () => {
        const asset = await sdk.cma.asset.create(
          {},
          {
            fields: {
              title: {},
              file: {},
            },
          }
        );

        sdk.navigator.openAsset(asset.sys.id);
      }}>
      Create new asset
    </Button>
  );
};

export default NewAssetButton;
