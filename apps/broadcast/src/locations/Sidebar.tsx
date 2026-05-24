import { SidebarAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  FormControl,
  Heading,
  Note,
  Paragraph,
  Select,
  Spinner,
  Stack,
  TextLink,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from 'contentful-management';
import {
  Voice,
  GetVoicesResponse,
  GenerateAudioResponse,
  AppInstallationParameters,
} from '../types';

type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generationMessage, setGenerationMessage] = useState<string>('');
  const [generatedAssetId, setGeneratedAssetId] = useState<string | null>(null);

  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );

  // Get text fields from the current entry
  const textFields = Object.entries(sdk.entry.fields)
    .filter(([_, field]) => {
      const fieldType = field.type;
      return fieldType === 'Symbol' || fieldType === 'Text' || fieldType === 'RichText';
    })
    .map(([id, field]) => ({
      id,
      name: field.name,
      type: field.type,
    }));

  // Fetch voices on mount
  useEffect(() => {
    const fetchVoices = async () => {
      setVoicesLoading(true);
      setVoicesError(null);

      try {
        const response = await cma.appActionCall.createWithResponse(
          {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
            appDefinitionId: sdk.ids.app!,
            appActionId: 'getVoicesAction',
          },
          {
            parameters: {},
          }
        );

        const responseData: GetVoicesResponse = JSON.parse(response.response.body);
        setVoices(responseData.voices);

        // Set default voice if available
        if (responseData.voices.length > 0) {
          setSelectedVoiceId(responseData.voices[0].voiceId);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch voices';
        setVoicesError(errorMessage);
        sdk.notifier.error('Failed to load voices. Please check your API key configuration.');
      } finally {
        setVoicesLoading(false);
      }
    };

    fetchVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default field if available
  useEffect(() => {
    if (textFields.length > 0 && !selectedFieldId) {
      setSelectedFieldId(textFields[0].id);
    }
  }, [textFields, selectedFieldId]);

  const handleGenerate = useCallback(async () => {
    if (!selectedVoiceId || !selectedFieldId) {
      sdk.notifier.error('Please select both a voice and a field.');
      return;
    }

    // Check if field has content
    const fieldValue = sdk.entry.fields[selectedFieldId].getValue();
    if (!fieldValue) {
      sdk.notifier.error('The selected field is empty. Please add content first.');
      return;
    }

    setGenerationStatus('loading');
    setGenerationMessage('Generating audio...');
    setGeneratedAssetId(null);

    try {
      const locale = sdk.locales.default;

      const response = await cma.appActionCall.createWithResponse(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
          appDefinitionId: sdk.ids.app!,
          appActionId: 'generateAudioAction',
        },
        {
          parameters: {
            entryId: sdk.ids.entry,
            fieldId: selectedFieldId,
            locale,
            voiceId: selectedVoiceId,
          },
        }
      );

      const responseData: GenerateAudioResponse = JSON.parse(response.response.body);

      if (responseData.success) {
        setGenerationStatus('success');
        setGenerationMessage(responseData.message || 'Audio generated successfully!');
        setGeneratedAssetId(responseData.assetId);
        sdk.notifier.success('Audio generated successfully!');
      } else {
        setGenerationStatus('error');
        setGenerationMessage(responseData.message || 'Failed to generate audio.');
        sdk.notifier.error(responseData.message || 'Failed to generate audio.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setGenerationStatus('error');
      setGenerationMessage(errorMessage);
      sdk.notifier.error(errorMessage);
    }
  }, [selectedVoiceId, selectedFieldId, sdk, cma]);

  const handleOpenAsset = useCallback(() => {
    if (generatedAssetId) {
      sdk.navigator.openAsset(generatedAssetId, { slideIn: true });
    }
  }, [generatedAssetId, sdk.navigator]);

  const handleOpenConfig = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      await sdk.navigator.openAppConfig();
    },
    [sdk.navigator]
  );

  // Check if API key is configured
  const hasApiKey = !!(sdk.parameters.installation as AppInstallationParameters)?.elevenLabsApiKey;

  if (!hasApiKey) {
    return (
      <Box padding="spacingM">
        <Note variant="warning" title="Configuration Required">
          <Paragraph marginBottom="spacingS">
            The ElevenLabs API key is not configured. Please configure the app to use Broadcast.
          </Paragraph>
          <TextLink as="button" onClick={handleOpenConfig}>
            Open App Configuration
          </TextLink>
        </Note>
      </Box>
    );
  }

  if (voicesLoading) {
    return (
      <Box padding="spacingM">
        <Stack flexDirection="column" alignItems="center" spacing="spacingM">
          <Spinner size="large" />
          <Paragraph>Loading voices...</Paragraph>
        </Stack>
      </Box>
    );
  }

  if (voicesError) {
    return (
      <Box padding="spacingM">
        <Note variant="negative" title="Error Loading Voices">
          <Paragraph marginBottom="spacingS">{voicesError}</Paragraph>
          <TextLink as="button" onClick={handleOpenConfig}>
            Check App Configuration
          </TextLink>
        </Note>
      </Box>
    );
  }

  if (textFields.length === 0) {
    return (
      <Box padding="spacingM">
        <Note variant="warning" title="No Text Fields">
          <Paragraph>
            This content type has no text fields (Symbol, Text, or RichText). Broadcast can only
            generate audio from text content.
          </Paragraph>
        </Note>
      </Box>
    );
  }

  return (
    <Box padding="spacingM">
      <Heading as="h3" marginBottom="spacingS">
        Generate Audio
      </Heading>
      <Paragraph marginBottom="spacingM">
        Convert your content to audio using ElevenLabs text-to-speech.
      </Paragraph>

      <Stack flexDirection="column" spacing="spacingM">
        <FormControl>
          <FormControl.Label>Select Field</FormControl.Label>
          <Select
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            isDisabled={generationStatus === 'loading'}>
            {textFields.map((field) => (
              <Select.Option key={field.id} value={field.id}>
                {field.name} ({field.type})
              </Select.Option>
            ))}
          </Select>
          <FormControl.HelpText>Choose which text field to convert to audio.</FormControl.HelpText>
        </FormControl>

        <FormControl>
          <FormControl.Label>Select Voice</FormControl.Label>
          <Select
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            isDisabled={generationStatus === 'loading'}>
            {voices.map((voice) => (
              <Select.Option key={voice.voiceId} value={voice.voiceId}>
                {voice.name} ({voice.category})
              </Select.Option>
            ))}
          </Select>
          <FormControl.HelpText>
            Choose the voice for text-to-speech conversion.
          </FormControl.HelpText>
        </FormControl>

        <Button
          variant="primary"
          isFullWidth
          onClick={handleGenerate}
          isLoading={generationStatus === 'loading'}
          isDisabled={!selectedVoiceId || !selectedFieldId || generationStatus === 'loading'}>
          {generationStatus === 'loading' ? 'Generating...' : 'Generate Audio'}
        </Button>

        {generationStatus === 'success' && (
          <Note variant="positive" title="Success">
            <Paragraph marginBottom="spacingS">{generationMessage}</Paragraph>
            {generatedAssetId && (
              <TextLink as="button" onClick={handleOpenAsset}>
                View Generated Asset
              </TextLink>
            )}
          </Note>
        )}

        {generationStatus === 'error' && (
          <Note variant="negative" title="Error">
            <Paragraph>{generationMessage}</Paragraph>
          </Note>
        )}
      </Stack>
    </Box>
  );
};

export default Sidebar;
