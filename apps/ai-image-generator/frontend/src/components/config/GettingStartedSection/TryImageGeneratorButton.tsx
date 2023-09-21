import { KnownAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { styles } from './GettingStartedSection.styles';
import { SyntheticEvent } from 'react';

const TryImageGeneratorButton = () => {
  const sdk = useSDK<KnownAppSDK>();

  const handleTryAiig = async (e: SyntheticEvent) => {
    e.preventDefault();
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
  };

  return (
    <Button variant="secondary" className={styles.button} onClick={handleTryAiig}>
      Try out AI image generator
    </Button>
  );
};

export default TryImageGeneratorButton;
