import { useSDK } from '@contentful/react-apps-toolkit';
import { OpenCustomWidgetOptions, SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Tooltip } from '@contentful/f36-components';
import { AIFeature } from '@configs/features/featureConfig';
import { DialogInvocationParameters } from '@locations/Dialog';
import { styles } from './FeatureButton.styles';

interface Props {
  feature: AIFeature;
  text: string;
  helpText: string;
  dialogTitle: string;
}

type openDialogOptions = OpenCustomWidgetOptions & { parameters: DialogInvocationParameters };

const FeatureButton = (props: Props) => {
  const { feature, text, dialogTitle, helpText } = props;
  const sdk = useSDK<SidebarAppSDK>();

  const handleOnClick = () => {
    const entryId = sdk.entry.getSys().id;

    const dialogConfig: openDialogOptions = {
      position: 'center',
      width: 'fullWidth',
      minHeight: '468px',
      title: dialogTitle,
      parameters: { feature, entryId },
    };

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
