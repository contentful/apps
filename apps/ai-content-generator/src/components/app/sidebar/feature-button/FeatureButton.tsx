import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Tooltip } from '@contentful/f36-components';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import { styles } from './FeatureButton.styles';
import { makeDialogConfig } from '@configs/dialog/dialogConfig';

interface Props {
  feature: AIFeature;
}

const FeatureButton = (props: Props) => {
  const { feature } = props;
  const buttonCopy = featureConfig[feature].buttonTitle;
  const sdk = useSDK<SidebarAppSDK>();

  const handleOnClick = () => {
    const entryId = sdk.entry.getSys().id;

    const dialogConfig = makeDialogConfig({ feature, entryId });

    sdk.dialogs.openCurrentApp(dialogConfig);
  };

  return (
    <Tooltip placement="top" id={feature}>
      <Button css={styles.button} onClick={handleOnClick}>
        {buttonCopy}
      </Button>
    </Tooltip>
  );
};

export default FeatureButton;
