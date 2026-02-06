import { useState, useEffect, useCallback } from 'react';
import { Button, Flex, Text, Stack } from '@contentful/f36-components';
import { css } from 'emotion';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { IconPreview } from '../components/IconPreview/IconPreview';
import type { IconFieldValue } from '../types/icon';
import type { AppInstallationParameters, DialogInvocationParameters } from '../types/parameters';
import { parseEnabledWeights } from '../types/parameters';

const styles = {
  container: css({
    padding: '8px 0',
  }),
  emptyState: css({
    padding: '32px 24px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px dashed #d1d5db',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  }),
  actions: css({
    marginTop: '12px',
  }),
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<IconFieldValue | null>(sdk.field.getValue() ?? null);

  const installationParams = sdk.parameters.installation as AppInstallationParameters;
  const enabledWeights = parseEnabledWeights(installationParams?.enabledWeights);

  useEffect(() => {
    sdk.window.startAutoResizer();
    return () => sdk.window.stopAutoResizer();
  }, [sdk.window]);

  useEffect(() => {
    const detach = sdk.field.onValueChanged((newValue: IconFieldValue | null) => {
      setValue(newValue ?? null);
    });
    return () => detach();
  }, [sdk.field]);

  const openDialog = useCallback(async () => {
    const dialogParams: DialogInvocationParameters = {
      currentValue: value ?? undefined,
      enabledWeights,
    };

    const result = await sdk.dialogs.openCurrentApp({
      title: 'Select Phosphor Icon',
      width: 'large',
      minHeight: 600,
      parameters: dialogParams,
    });

    if (result) {
      await sdk.field.setValue(result as IconFieldValue);
    }
  }, [sdk.dialogs, sdk.field, value, enabledWeights]);

  const handleRemove = useCallback(async () => {
    await sdk.field.removeValue();
  }, [sdk.field]);

  if (!value) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Text fontColor="gray600" marginBottom="spacingS">
            No icon selected
          </Text>
          <Button variant="primary" onClick={openDialog}>
            Select Icon
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <IconPreview value={value} />
      <Stack flexDirection="row" spacing="spacingS" marginTop="spacingM" className={styles.actions}>
        <Button variant="secondary" onClick={openDialog}>
          Change
        </Button>
        <Button variant="negative" onClick={handleRemove}>
          Remove
        </Button>
      </Stack>
    </div>
  );
};

export default Field;
