import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Tooltip } from '@contentful/f36-components';
import { AIFeature } from '@configs/features/featureConfig';
import { styles } from './FeatureButton.styles';
import { makeDialogConfig } from '@configs/dialog/dialogConfig';

interface Props {
  feature: AIFeature;
  text: string;
  helpText: string;
}

const FeatureButton = (props: Props) => {
  const { feature, text, helpText } = props;
  const sdk = useSDK<SidebarAppSDK>();

  const handleOnClick = () => {
    const entryId = sdk.entry.getSys().id;

    const dialogConfig = makeDialogConfig({ feature, entryId });

    sdk.dialogs.openCurrentApp(dialogConfig);
  };

  return (
    <Tooltip placement="top" id={feature} content={helpText}>
      <Button className={styles.button} title={helpText} onClick={handleOnClick}>
        {text}
      </Button>
    </Tooltip>
  );
};

export default FeatureButton;
