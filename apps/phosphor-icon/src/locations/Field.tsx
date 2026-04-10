import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Note, Paragraph, Stack, Text } from '@contentful/f36-components';
import { css } from 'emotion';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { IconPreview } from '../components/IconPreview/IconPreview';
import type { IconFieldValue, IconWeight } from '../types/icon';
import { ICON_WEIGHT_LABELS } from '../types/icon';
import type { AppInstallationParameters, DialogInvocationParameters } from '../types/parameters';
import {
  parseEnabledWeights,
  parsePositionOptions,
  parseSelectedIconNames,
} from '../types/parameters';
const styles = {
  container: css({
    padding: '8px 0',
  }),
  emptyState: css({
    padding: '32px 24px',
    backgroundColor: '#f7f9fa',
    borderRadius: '8px',
    border: '1px dashed #cfd9e5',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  }),
  actions: css({
    marginTop: '12px',
  }),
  helperCopy: css({
    maxWidth: '320px',
  }),
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<IconFieldValue | null>(sdk.field.getValue() ?? null);
  const [isOpeningDialog, setIsOpeningDialog] = useState(false);
  const [enabledWeights, setEnabledWeights] = useState<IconWeight[]>(
    parseEnabledWeights((sdk.parameters.installation as AppInstallationParameters)?.enabledWeights)
  );

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

  const fetchLatestInstallationParameters =
    useCallback(async (): Promise<AppInstallationParameters> => {
      try {
        if (!sdk.ids.app) {
          throw new Error('Required app ID not available');
        }

        if (
          sdk.cma?.appInstallation &&
          typeof sdk.cma.appInstallation.getForOrganization === 'function' &&
          sdk.ids.organization &&
          sdk.ids.space &&
          sdk.ids.environment
        ) {
          const appInstallation = await sdk.cma.appInstallation.getForOrganization({
            appDefinitionId: sdk.ids.app,
            organizationId: sdk.ids.organization,
          });

          const currentInstallation = appInstallation.items.find(
            (installation) =>
              installation.sys.space.sys.id === sdk.ids.space &&
              installation.sys.environment.sys.id === sdk.ids.environment
          );

          if (currentInstallation?.parameters) {
            return currentInstallation.parameters as AppInstallationParameters;
          }
        }

        if (sdk.cma?.appInstallation && typeof sdk.cma.appInstallation.get === 'function') {
          const appInstallation = await sdk.cma.appInstallation.get({
            appDefinitionId: sdk.ids.app,
          });

          if (appInstallation?.parameters) {
            return appInstallation.parameters as AppInstallationParameters;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch fresh installation parameters from CMA:', error);
      }

      return (sdk.parameters.installation as AppInstallationParameters) ?? {};
    }, [sdk]);

  useEffect(() => {
    let isMounted = true;

    const syncInstallationParameters = async () => {
      const installationParams = await fetchLatestInstallationParameters();

      if (!isMounted) {
        return;
      }

      setEnabledWeights(parseEnabledWeights(installationParams?.enabledWeights));
    };

    void syncInstallationParameters();

    return () => {
      isMounted = false;
    };
  }, [fetchLatestInstallationParameters]);

  const openDialog = useCallback(async () => {
    if (isOpeningDialog) {
      return;
    }

    setIsOpeningDialog(true);

    try {
      const installationParams = await fetchLatestInstallationParameters();
      const enabledWeights = parseEnabledWeights(installationParams?.enabledWeights);
      const positionOptions = parsePositionOptions(installationParams?.positionOptions);
      const allowedIconNames =
        installationParams?.iconAvailabilityMode === 'specific'
          ? parseSelectedIconNames(installationParams?.selectedIconNames)
          : [];

      const dialogParams: DialogInvocationParameters = {
        currentValue: value ?? undefined,
        enabledWeights,
        positionOptions,
        mode: 'single',
        allowedIconNames: allowedIconNames.length > 0 ? allowedIconNames : undefined,
      };

      const result = await sdk.dialogs.openCurrentApp({
        title: 'Select Phosphor Icon',
        width: 'large',
        minHeight: 680,
        parameters: dialogParams,
      });

      if (result) {
        await sdk.field.setValue(result as IconFieldValue);
      }
    } finally {
      setIsOpeningDialog(false);
    }
  }, [fetchLatestInstallationParameters, isOpeningDialog, sdk.dialogs, sdk.field, value]);

  const handleRemove = useCallback(async () => {
    await sdk.field.removeValue();
  }, [sdk.field]);

  const hasInvalidConfiguredStyle = Boolean(value && !enabledWeights.includes(value.weight));

  if (!value) {
    return (
      <div className={styles.container}>
        <Box className={styles.emptyState}>
          <Text fontColor="gray600">No icon selected</Text>
          <Paragraph marginTop="none" marginBottom="none" className={styles.helperCopy}>
            Pick an icon, then adjust its style and position before saving it to this field.
          </Paragraph>
          <Button
            variant="primary"
            onClick={openDialog}
            isLoading={isOpeningDialog}
            isDisabled={isOpeningDialog}>
            Select icon
          </Button>
        </Box>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <IconPreview value={value} />
      {hasInvalidConfiguredStyle ? (
        <Note variant="warning" title="Selected style is no longer allowed">
          This entry currently uses {ICON_WEIGHT_LABELS[value.weight]}. An admin removed that style
          from the allowed list in the app configuration.
        </Note>
      ) : null}
      <Paragraph marginTop="spacingS" marginBottom="none">
        Use &quot;Update&quot; to modify icon, style or position.
      </Paragraph>
      <Stack flexDirection="row" spacing="spacingS" marginTop="spacingM" className={styles.actions}>
        <Button
          variant="secondary"
          onClick={openDialog}
          isLoading={isOpeningDialog}
          isDisabled={isOpeningDialog}>
          Update
        </Button>
        <Button variant="negative" onClick={handleRemove} isDisabled={isOpeningDialog}>
          Remove
        </Button>
      </Stack>
    </div>
  );
};

export default Field;
