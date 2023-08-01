import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Spinner, Tooltip } from '@contentful/f36-components';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import { styles } from './FeatureButton.styles';
import { makeDialogConfig } from '@configs/dialog/dialogConfig';
import { useState } from 'react';

interface Props {
  feature: AIFeature;
  isSaving: boolean;
  onSaving: (isSaving: boolean) => void;
}

interface FieldLocales {
  [key: string]: string[];
}

const FeatureButton = (props: Props) => {
  const { feature, isSaving, onSaving } = props;
  const buttonCopy = featureConfig[feature].buttonTitle;
  const sdk = useSDK<SidebarAppSDK>();

  const [isOpeningDialog, setIsOpeningDialog] = useState(false);

  const fields = sdk.entry.fields;
  const fieldLocales = Object.entries(fields).reduce((acc, entryField) => {
    const [fieldId, field] = entryField;
    acc[fieldId] = field.locales;
    return acc;
  }, {} as FieldLocales);

  const updateSaveState = (toggleTo: boolean) => {
    onSaving(toggleTo);
    setIsOpeningDialog(toggleTo);
  };

  const handleOnClick = async () => {
    if (isSaving) {
      return;
    }

    try {
      updateSaveState(true);
      await sdk.entry.save();
    } catch (error) {
      console.error(error);
    } finally {
      updateSaveState(false);
    }

    const entryId = sdk.entry.getSys().id;

    const dialogConfig = makeDialogConfig({ feature, entryId, fieldLocales });

    sdk.dialogs.openCurrentApp(dialogConfig);
  };

  return (
    <Tooltip placement="top" id={feature}>
      <Button css={styles.button} onClick={handleOnClick}>
        {buttonCopy} {isOpeningDialog && <Spinner size="small" />}
      </Button>
    </Tooltip>
  );
};

export default FeatureButton;
