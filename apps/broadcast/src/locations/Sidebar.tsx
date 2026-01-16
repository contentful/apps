import { Button, Flex, Note, Spinner, Text } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';

type GenerateAudioResult = {
  status: 'success';
  assetId: string;
  url: string;
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

  const installParams = sdk.parameters.installation as InstallationParameters | undefined;

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

    const bodyValue = bodyField.getValue();
    const text = typeof bodyValue === 'string' ? bodyValue.trim() : '';
    if (!text) {
      sdk.notifier.error('Body field is empty.');
      return;
    }

    const voiceId = installParams?.voiceId;
    if (!voiceId) {
      sdk.notifier.error('Missing voiceId in app configuration.');
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
          appDefinitionId: sdk.ids.app || '',
          appActionId,
        },
        {
          parameters: {
            text,
            entryId: sdk.ids.entry,
            spaceId: sdk.ids.space,
            envId: sdk.ids.environment,
            voiceId,
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

      await audioField.setValue({
        sys: {
          type: 'Link',
          linkType: 'Asset',
          id: result.data.assetId,
        },
      });
      setAudioUrl(result.data.url);
    } catch (error) {
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
      {isLoading ? (
        <Flex alignItems="center" gap="spacingS">
          <Spinner size="small" />
          <Text>Generating audio...</Text>
        </Flex>
      ) : (
        <Button variant="primary" onClick={handleGenerateAudio} isDisabled={isLoading}>
          Generate Audio
        </Button>
      )}
      {audioUrl ? <audio controls src={audioUrl} /> : null}
    </Flex>
  );
};

export default Sidebar;
