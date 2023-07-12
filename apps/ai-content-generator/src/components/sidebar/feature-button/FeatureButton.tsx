import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Tooltip } from '@contentful/f36-components';
import { AIFeature } from '@configs/features/featureConfig';

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

    sdk.dialogs.openCurrentApp({
      position: 'center',
      width: 'fullWidth',
      minHeight: '468px',
      title: text,
      parameters: { feature, entryId },
    });
  };

  return (
    <Tooltip placement="top" id={feature} content={helpText}>
      <Button title={helpText} onClick={handleOnClick}>
        {text}
      </Button>
    </Tooltip>
  );
};

export default FeatureButton;
