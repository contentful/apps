import {
  Box,
  Button,
  Flex,
  FormControl,
  Note,
  Select,
  Spinner,
  Text,
} from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useMemo, useState } from 'react';

type GenerateAudioResult = {
  status: 'success';
  assetId: string;
  url: string;
  locale: string;
};

type AppActionResult =
  | { ok: true; data: GenerateAudioResult }
  | { ok: false; errors?: Array<{ message: string }> };

type InstallationParameters = {
  generateAudioActionId?: string;
  voiceId?: string;
};

const BODY_FIELD_ID = 'body';
const AUDIO_ASSET_FIELD_ID = 'audioAsset';
const ACTION_NAME = 'Generate Audio';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<string>(() => sdk.locales.default);

  const installParams = sdk.parameters.installation as InstallationParameters | undefined;

  const localeOptions = useMemo(
    () =>
      sdk.locales.available.map((locale) => ({
        value: locale,
        label: locale,
      })),
    [sdk.locales.available]
  );

  const resolveActionId = async (): Promise<string | null> => {
    if (installParams?.generateAudioActionId) {
      return installParams.generateAudioActionId;
    }

    const appDefinitionId = sdk.ids.app;
    if (!appDefinitionId) {
      return null;
    }

    const actions = await sdk.cma.appAction.getMany({ appDefinitionId });
    const matchedAction = actions.items.find((action) => action.name === ACTION_NAME);
    return matchedAction?.sys.id ?? null;
  };

  const handleGenerateAudio = async () => {
    const audioField = sdk.entry.fields[AUDIO_ASSET_FIELD_ID];
    if (!audioField) {
      sdk.notifier.error(`Missing field: ${AUDIO_ASSET_FIELD_ID}`);
      return;
    }

    const bodyField = sdk.entry.fields[BODY_FIELD_ID];
    if (!bodyField) {
      sdk.notifier.error(`Missing field: ${BODY_FIELD_ID}`);
      return;
    }

    const voiceId = installParams?.voiceId;
    if (!voiceId) {
      sdk.notifier.error('Missing voiceId in app configuration.');
      return;
    }

    if (!sdk.ids.app) {
      sdk.notifier.error('App definition ID is unavailable. Please reload the entry.');
      return;
    }

    if (!sdk.ids.entry) {
      sdk.notifier.error('Entry ID is unavailable. Please reload the entry.');
      return;
    }

    setIsLoading(true);
    try {
      const appActionId = await resolveActionId();
      if (!appActionId) {
        sdk.notifier.error('Generate Audio app action not found.');
        return;
      }

      const appActionCall = await sdk.cma.appActionCall.createWithResult(
        {
          appDefinitionId: sdk.ids.app,
          appActionId,
        },
        {
          parameters: {
            entryId: sdk.ids.entry,
            fieldId: AUDIO_ASSET_FIELD_ID,
            targetLocale: selectedLocale,
            ...(voiceId ? { voiceId } : {}),
          },
        }
      );

      if (appActionCall.sys.status !== 'succeeded') {
        sdk.notifier.error('Audio generation failed.');
        return;
      }

      const result = appActionCall.sys.result as AppActionResult | undefined;
      if (!result || !result.ok || result.data.status !== 'success') {
        sdk.notifier.error('Audio generation failed.');
        return;
      }

      setAudioUrl(result.data.url);
      await sdk.navigator.openEntry(sdk.ids.entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('generate-audio:sidebar-error', message, error);
      sdk.notifier.error('Audio generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!sdk.entry.fields[AUDIO_ASSET_FIELD_ID]) {
    return (
      <Note variant="negative">Missing field: please add a Media field with ID 'audioAsset'.</Note>
    );
  }

  return (
    <Flex flexDirection="column" gap="spacingM">
      <FormControl marginBottom="spacingXs">
        <FormControl.Label>Target locale</FormControl.Label>
        <Box
          maxWidth="95%"
          paddingLeft="spacingXs"
          paddingRight="spacingXs"
          paddingBottom="spacingXs"
          css={{ overflow: 'visible' }}>
          <Select
            id="audioLocale"
            name="audioLocale"
            value={selectedLocale}
            onChange={(event) => setSelectedLocale(event.target.value)}
            isDisabled={isLoading}>
            {localeOptions.map((locale) => (
              <Select.Option key={locale.value} value={locale.value}>
                {locale.label}
              </Select.Option>
            ))}
          </Select>
        </Box>
      </FormControl>
      {isLoading ? (
        <Flex alignItems="center" gap="spacingS">
          <Spinner size="small" />
          <Text>Generating audio...</Text>
        </Flex>
      ) : (
        <Button variant="primary" onClick={handleGenerateAudio} isDisabled={isLoading} isFullWidth>
          Generate Audio
        </Button>
      )}
      {audioUrl ? <audio controls src={audioUrl} /> : null}
    </Flex>
  );
};

export default Sidebar;
