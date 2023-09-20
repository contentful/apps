import { KnownAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { styles } from './GettingStartedSection.styles';

const TryContentGeneratorButton = () => {
  const sdk = useSDK<KnownAppSDK>();

  return (
    <Button
      variant="secondary"
      className={styles.button}
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
      Try out AI image generator
    </Button>
  );
};

export default TryContentGeneratorButton;
