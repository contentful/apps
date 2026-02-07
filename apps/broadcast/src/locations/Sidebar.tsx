import { Box, Button, Flex, FormControl, Note, Select, Text } from '@contentful/f36-components';
import { EntryFieldAPI, SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useVideoGenerator } from '../hooks/useVideoGenerator';
import { uploadVideoAsset } from '../lib/contentful-upload';
import { delay } from '../lib/delay';
import { DEMO_AUDIO_ASSET_ID, DEMO_DELAY_MS, DEMO_VIDEO_ASSET_ID } from '../constants';

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
  demoMode?: boolean;
  waveformColor?: string;
  waveformOpacity?: number;
  kenBurnsZoomIncrement?: number;
  kenBurnsMaxZoom?: number;
  kenBurnsEnabled?: boolean;
};

type AssetLink = {
  sys: {
    type: 'Link';
    linkType: 'Asset';
    id: string;
  };
};

const BODY_FIELD_ID = 'body';
const AUDIO_ASSET_FIELD_ID = 'audioAsset';
const VIDEO_ASSET_FIELD_ID = 'videoAsset';
const IMAGE_FIELD_CANDIDATES = ['featuredImage', 'image'];
const ACTION_NAME = 'Generate Audio';

const normalizeAssetUrl = (url: string) => (url.startsWith('//') ? `https:${url}` : url);

const isAssetLink = (value: unknown): value is AssetLink => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const sys = (value as AssetLink).sys;
  return sys?.type === 'Link' && sys?.linkType === 'Asset' && typeof sys?.id === 'string';
};

const getAssetLinkFromValue = (value: unknown): AssetLink | null => {
  if (isAssetLink(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    const match = value.find(isAssetLink);
    return match ?? null;
  }

  return null;
};

const createAssetLink = (assetId: string): AssetLink => ({
  sys: {
    type: 'Link',
    linkType: 'Asset',
    id: assetId,
  },
});

const getFieldValueWithFallback = (
  field: EntryFieldAPI,
  locale: string,
  fallbackLocale: string
) => {
  const localizedValue = field.getValue(locale);
  if (localizedValue !== undefined && localizedValue !== null) {
    return localizedValue;
  }

  if (locale !== fallbackLocale) {
    return field.getValue(fallbackLocale);
  }

  return localizedValue;
};

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const [isLoading, setIsLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<string>(() => sdk.locales.default);

  const { generateVideo } = useVideoGenerator();

  const installParams = sdk.parameters.installation as InstallationParameters | undefined;
  const isDemoMode = Boolean(installParams?.demoMode);
  const audioField = sdk.entry.fields[AUDIO_ASSET_FIELD_ID];
  const videoField = sdk.entry.fields[VIDEO_ASSET_FIELD_ID];

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

  const imageFieldId = IMAGE_FIELD_CANDIDATES.find((fieldId) => sdk.entry.fields[fieldId]);

  const resolveAssetUrl = useCallback(
    async (fieldId: string): Promise<string | null> => {
      const field = sdk.entry.fields[fieldId];
      if (!field) {
        return null;
      }

      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;
      if (!spaceId || !environmentId) {
        throw new Error('Space or environment ID is unavailable.');
      }

      const fieldValue = getFieldValueWithFallback(field, selectedLocale, sdk.locales.default);
      const assetLink = getAssetLinkFromValue(fieldValue);
      if (!assetLink) {
        return null;
      }

      const asset = await sdk.cma.asset.get({
        spaceId,
        environmentId,
        assetId: assetLink.sys.id,
      });

      const fileField =
        asset.fields.file?.[selectedLocale] ?? asset.fields.file?.[sdk.locales.default];
      const assetUrl = fileField?.url;
      return assetUrl ? normalizeAssetUrl(assetUrl) : null;
    },
    [sdk, selectedLocale]
  );

  const resolveAssetUrlById = useCallback(
    async (assetId: string): Promise<string | null> => {
      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;
      if (!spaceId || !environmentId) {
        throw new Error('Space or environment ID is unavailable.');
      }

      const asset = await sdk.cma.asset.get({
        spaceId,
        environmentId,
        assetId,
      });
      const fileField =
        asset.fields.file?.[selectedLocale] ?? asset.fields.file?.[sdk.locales.default];
      const assetUrl = fileField?.url;
      return assetUrl ? normalizeAssetUrl(assetUrl) : null;
    },
    [sdk, selectedLocale]
  );

  useEffect(() => {
    if (!videoField) {
      setVideoUrl(null);
      return;
    }

    let isActive = true;
    const loadVideoUrl = async () => {
      try {
        const resolvedVideoUrl = await resolveAssetUrl(VIDEO_ASSET_FIELD_ID);
        if (isActive) {
          setVideoUrl(resolvedVideoUrl);
        }
      } catch (error) {
        console.error('resolve-video-url:sidebar-error', error);
        if (isActive) {
          setVideoUrl(null);
        }
      }
    };

    void loadVideoUrl();

    return () => {
      isActive = false;
    };
  }, [resolveAssetUrl, selectedLocale, videoField]);

  useEffect(() => {
    if (!audioField) {
      setAudioUrl(null);
      return;
    }

    let isActive = true;
    const loadAudioUrl = async () => {
      try {
        const resolvedAudioUrl = await resolveAssetUrl(AUDIO_ASSET_FIELD_ID);
        if (isActive) {
          setAudioUrl(resolvedAudioUrl);
        }
      } catch (error) {
        console.error('resolve-audio-url:sidebar-error', error);
        if (isActive) {
          setAudioUrl(null);
        }
      }
    };

    void loadAudioUrl();

    return () => {
      isActive = false;
    };
  }, [audioField, resolveAssetUrl, selectedLocale]);

  const handleGenerateAudio = async () => {
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
    if (!isDemoMode && !voiceId) {
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

    if (!sdk.ids.space || !sdk.ids.environment) {
      sdk.notifier.error('Space or environment ID is unavailable. Please reload the entry.');
      return;
    }

    setIsLoading(true);
    try {
      if (isDemoMode) {
        await delay(DEMO_DELAY_MS);
        await audioField.setValue(createAssetLink(DEMO_AUDIO_ASSET_ID), selectedLocale);
        const resolvedAudioUrl =
          (await resolveAssetUrl(AUDIO_ASSET_FIELD_ID)) ??
          (await resolveAssetUrlById(DEMO_AUDIO_ASSET_ID));
        setAudioUrl(resolvedAudioUrl);
        sdk.notifier.success('Demo audio attached.');
        return;
      }

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

      setAudioUrl(normalizeAssetUrl(result.data.url));
      await sdk.navigator.openEntry(sdk.ids.entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('generate-audio:sidebar-error', message, error);
      sdk.notifier.error('Audio generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!sdk.ids.space || !sdk.ids.environment) {
      sdk.notifier.error('Space or environment ID is unavailable. Please reload the entry.');
      return;
    }

    if (isDemoMode) {
      setIsVideoLoading(true);
      try {
        await delay(DEMO_DELAY_MS);
        if (videoField) {
          await videoField.setValue(createAssetLink(DEMO_VIDEO_ASSET_ID), selectedLocale);
        } else {
          sdk.notifier.warning(
            `Demo video available but missing field: ${VIDEO_ASSET_FIELD_ID}. Unable to link.`
          );
        }

        const resolvedVideoUrl =
          (await resolveAssetUrl(VIDEO_ASSET_FIELD_ID)) ??
          (await resolveAssetUrlById(DEMO_VIDEO_ASSET_ID));
        setVideoUrl(resolvedVideoUrl);
        sdk.notifier.success('Demo video attached.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('demo-video:sidebar-error', message, error);
        sdk.notifier.error('Demo video attachment failed. Please try again.');
      } finally {
        setIsVideoLoading(false);
      }
      return;
    }

    if (!imageFieldId) {
      sdk.notifier.error('Missing field: please add a Media field with ID featuredImage or image.');
      return;
    }

    if (!sdk.ids.entry) {
      sdk.notifier.error('Entry ID is unavailable. Please reload the entry.');
      return;
    }

    setIsVideoLoading(true);
    try {
      const resolvedAudioUrl = audioUrl ?? (await resolveAssetUrl(AUDIO_ASSET_FIELD_ID));
      if (!resolvedAudioUrl) {
        sdk.notifier.error('Missing audio asset. Generate audio first.');
        return;
      }

      const resolvedImageUrl = await resolveAssetUrl(imageFieldId);
      if (!resolvedImageUrl) {
        sdk.notifier.error(`Missing image asset for field: ${imageFieldId}.`);
        return;
      }

      const videoBlob = await generateVideo({
        imageUrl: resolvedImageUrl,
        audioUrl: resolvedAudioUrl,
        waveformColor: installParams?.waveformColor,
        waveformOpacity: installParams?.waveformOpacity,
        kenBurnsZoomIncrement: installParams?.kenBurnsZoomIncrement,
        kenBurnsMaxZoom: installParams?.kenBurnsMaxZoom,
        kenBurnsEnabled: installParams?.kenBurnsEnabled,
      });

      const assetId = await uploadVideoAsset(sdk, videoBlob, {
        title: `Broadcast Video - ${sdk.ids.entry} - ${selectedLocale}`,
        fileName: `broadcast-${sdk.ids.entry}-${selectedLocale}.mp4`,
      });

      if (videoField) {
        await videoField.setValue(
          {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: assetId,
            },
          },
          selectedLocale
        );
      } else {
        sdk.notifier.warning(
          `Video generated but missing field: ${VIDEO_ASSET_FIELD_ID}. Unable to link.`
        );
      }

      const resolvedVideoUrl = await resolveAssetUrl(VIDEO_ASSET_FIELD_ID);
      if (resolvedVideoUrl) {
        setVideoUrl(resolvedVideoUrl);
      }

      sdk.notifier.success('Video generated and uploaded.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('generate-video:sidebar-error', message, error);
      sdk.notifier.error(
        message.includes('download failed') ? message : 'Video generation failed. Please try again.'
      );
    } finally {
      setIsVideoLoading(false);
    }
  };

  const hasAudioAsset =
    Boolean(audioUrl) ||
    Boolean(
      audioField &&
        getAssetLinkFromValue(
          getFieldValueWithFallback(audioField, selectedLocale, sdk.locales.default)
        )
    );

  const resolvedVideoUrl = videoUrl;

  if (!audioField) {
    return (
      <Note variant="negative">Missing field: please add a Media field with ID 'audioAsset'.</Note>
    );
  }

  return (
    <Flex flexDirection="column" gap="spacingM">
      <Flex flexDirection="column" gap="spacingS">
        <FormControl marginBottom="spacingXs">
          <FormControl.Label>Target locale</FormControl.Label>
          <Box width="100%" css={{ overflow: 'visible' }}>
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
        <Button
          variant="primary"
          onClick={handleGenerateAudio}
          isDisabled={isLoading}
          isLoading={isLoading}
          isFullWidth>
          Generate audio
        </Button>
      </Flex>
      {audioUrl ? <audio controls src={audioUrl} /> : null}
      <Flex flexDirection="column" gap="spacingS">
        <Text fontWeight="fontWeightDemiBold">Social Video</Text>
        {!imageFieldId ? (
          <Note variant="negative">
            Missing field: please add a Media field with ID 'featuredImage' or 'image'.
          </Note>
        ) : null}
        {!hasAudioAsset ? (
          <Note variant="warning">Generate audio first to enable video rendering.</Note>
        ) : null}
        {!videoField ? (
          <Note variant="warning">
            Missing field: videoAsset. The video will be uploaded but not linked.
          </Note>
        ) : null}
        <Button
          variant="secondary"
          onClick={handleGenerateVideo}
          isDisabled={isVideoLoading || isLoading || !imageFieldId || !hasAudioAsset}
          isLoading={isVideoLoading}
          isFullWidth>
          Generate social video
        </Button>
        {resolvedVideoUrl ? (
          <video src={resolvedVideoUrl} controls style={{ width: '100%', borderRadius: '8px' }} />
        ) : null}
      </Flex>
    </Flex>
  );
};

export default Sidebar;
