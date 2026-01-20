import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Card,
  Checkbox,
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  SectionHeading,
  Stack,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {
  elevenLabsApiKey?: string;
  voiceId?: string;
  generateAudioActionId?: string;
  useMockAi?: boolean;
  waveformColor?: string;
  waveformOpacity?: number;
  kenBurnsZoomIncrement?: number;
  kenBurnsMaxZoom?: number;
  kenBurnsEnabled?: boolean;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    elevenLabsApiKey: '',
    voiceId: '',
    generateAudioActionId: '',
    useMockAi: false,
    waveformColor: 'white',
    waveformOpacity: 0.9,
    kenBurnsZoomIncrement: 0.0005,
    kenBurnsMaxZoom: 1.5,
    kenBurnsEnabled: false,
  });
  const sdk = useSDK<ConfigAppSDK>();
  /*
     To use the cma, access it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = sdk.cma;

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    if (!parameters.useMockAi && !parameters.elevenLabsApiKey) {
      sdk.notifier.error('Please provide an ElevenLabs API key or enable mock mode.');
      return false;
    }

    if (!parameters.voiceId) {
      sdk.notifier.error('Please provide a voice ID.');
      return false;
    }

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters({
          elevenLabsApiKey: currentParameters.elevenLabsApiKey || '',
          voiceId: currentParameters.voiceId || '',
          generateAudioActionId: currentParameters.generateAudioActionId || '',
          useMockAi: Boolean(currentParameters.useMockAi),
          waveformColor: currentParameters.waveformColor || 'white',
          waveformOpacity: currentParameters.waveformOpacity ?? 0.9,
          kenBurnsZoomIncrement: currentParameters.kenBurnsZoomIncrement ?? 0.0005,
          kenBurnsMaxZoom: currentParameters.kenBurnsMaxZoom ?? 1.5,
          kenBurnsEnabled: currentParameters.kenBurnsEnabled ?? false,
        });
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Box style={{ padding: tokens.spacingL }}>
      <Box style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Form>
          <Stack spacing="spacingL" flexDirection="column">
            <Stack spacing="spacingS">
              <Heading>Voice &amp; Video Studio</Heading>
              <Paragraph>
                Configure your ElevenLabs credentials and audio generation settings.
              </Paragraph>
            </Stack>

            <Card>
              <Stack spacing="spacingM" flexDirection="column" alignItems="stretch" fullWidth>
                <SectionHeading>Audio Configuration</SectionHeading>
                <Stack spacing="spacingM" flexDirection="column" alignItems="stretch" fullWidth>
                  <FormControl
                    isRequired
                    isInvalid={!parameters.useMockAi && !parameters.elevenLabsApiKey}>
                    <FormControl.Label>ElevenLabs API key</FormControl.Label>
                    <TextInput
                      id="elevenLabsApiKey"
                      name="elevenLabsApiKey"
                      type="password"
                      value={parameters.elevenLabsApiKey}
                      onChange={(event) =>
                        setParameters({
                          ...parameters,
                          elevenLabsApiKey: event.target.value,
                        })
                      }
                      isDisabled={parameters.useMockAi}
                    />
                    <FormControl.HelpText>
                      <Flex alignItems="center" gap="spacingXs" flexWrap="wrap">
                        <span>
                          Store this as a secret app installation parameter. Create or manage keys
                          in ElevenLabs.
                        </span>
                        <TextLink
                          href="https://elevenlabs.io/app/speech-synthesis"
                          target="_blank"
                          rel="noopener noreferrer"
                          alignIcon="end"
                          icon={<ExternalLinkIcon />}>
                          Manage ElevenLabs keys
                        </TextLink>
                      </Flex>
                    </FormControl.HelpText>
                    {!parameters.useMockAi && !parameters.elevenLabsApiKey && (
                      <FormControl.ValidationMessage>
                        Provide an API key or enable mock mode.
                      </FormControl.ValidationMessage>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={!parameters.voiceId}>
                    <FormControl.Label>Voice ID</FormControl.Label>
                    <TextInput
                      id="voiceId"
                      name="voiceId"
                      value={parameters.voiceId}
                      onChange={(event) =>
                        setParameters({
                          ...parameters,
                          voiceId: event.target.value,
                        })
                      }
                    />
                    {!parameters.voiceId && (
                      <FormControl.ValidationMessage>
                        Voice ID is required.
                      </FormControl.ValidationMessage>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormControl.Label>Generate Audio action ID (optional)</FormControl.Label>
                    <TextInput
                      id="generateAudioActionId"
                      name="generateAudioActionId"
                      value={parameters.generateAudioActionId}
                      onChange={(event) =>
                        setParameters({
                          ...parameters,
                          generateAudioActionId: event.target.value,
                        })
                      }
                      placeholder="Auto-resolve by action name if left empty"
                    />
                    <FormControl.HelpText>
                      If set, the Sidebar will call this App Action directly. Otherwise it will look
                      for an action named &quot;Generate Audio&quot;.
                    </FormControl.HelpText>
                  </FormControl>

                  <FormControl>
                    <FormControl.Label>Mock audio generator</FormControl.Label>
                    <Checkbox
                      id="useMockAi"
                      isChecked={parameters.useMockAi}
                      onChange={(event) =>
                        setParameters({
                          ...parameters,
                          useMockAi: event.target.checked,
                        })
                      }
                      aria-label="Use mock audio generator"
                    />
                    <FormControl.HelpText>
                      Enable mock mode to test the app without an ElevenLabs API key.
                    </FormControl.HelpText>
                  </FormControl>
                </Stack>
              </Stack>
            </Card>

            <Card>
              <Stack spacing="spacingM" flexDirection="column" alignItems="stretch" fullWidth>
                <SectionHeading>Video Rendering</SectionHeading>
                <Paragraph>
                  Customize the waveform overlay and Ken Burns zoom effect for generated social
                  videos.
                </Paragraph>
                <Stack spacing="spacingM" flexDirection="column" alignItems="stretch" fullWidth>
                  <FormControl>
                    <FormControl.Label>Waveform color</FormControl.Label>
                    <Flex alignItems="center" gap="spacingS">
                      <input
                        id="waveformColor"
                        name="waveformColor"
                        type="color"
                        value={parameters.waveformColor || '#ffffff'}
                        onChange={(event) =>
                          setParameters({
                            ...parameters,
                            waveformColor: event.target.value,
                          })
                        }
                        aria-label="Waveform color picker"
                        className={css({
                          width: '44px',
                          height: '44px',
                          padding: 0,
                          border: '1px solid #CBD5E0',
                          borderRadius: tokens.borderRadiusMedium,
                          background: 'transparent',
                        })}
                      />
                      <TextInput
                        value={parameters.waveformColor || ''}
                        onChange={(event) =>
                          setParameters({
                            ...parameters,
                            waveformColor: event.target.value,
                          })
                        }
                        placeholder="#FFFFFF"
                        aria-label="Waveform color hex value"
                      />
                    </Flex>
                    <FormControl.HelpText>
                      Uses hex colors from the native picker (for example: #FFFFFF).
                    </FormControl.HelpText>
                  </FormControl>

                  <FormControl>
                    <FormControl.Label>Waveform opacity (0-1)</FormControl.Label>
                    <TextInput
                      id="waveformOpacity"
                      name="waveformOpacity"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={parameters.waveformOpacity ?? ''}
                      onChange={(event) =>
                        setParameters({
                          ...parameters,
                          waveformOpacity: event.target.value
                            ? Number.parseFloat(event.target.value)
                            : undefined,
                        })
                      }
                    />
                    <FormControl.HelpText>
                      Lower values make the waveform more transparent.
                    </FormControl.HelpText>
                  </FormControl>

                  <FormControl>
                    <FormControl.Label>Ken Burns effect</FormControl.Label>
                    <Checkbox
                      id="kenBurnsEnabled"
                      isChecked={parameters.kenBurnsEnabled ?? true}
                      onChange={(event) =>
                        setParameters({
                          ...parameters,
                          kenBurnsEnabled: event.target.checked,
                        })
                      }
                      aria-label="Enable Ken Burns effect"
                    />
                    <FormControl.HelpText>
                      Adds a subtle zoom animation to the still image.
                    </FormControl.HelpText>
                  </FormControl>

                  {parameters.kenBurnsEnabled ? (
                    <Stack spacing="spacingM" flexDirection="column" alignItems="stretch" fullWidth>
                      <FormControl>
                        <FormControl.Label>Ken Burns zoom increment</FormControl.Label>
                        <TextInput
                          id="kenBurnsZoomIncrement"
                          name="kenBurnsZoomIncrement"
                          type="number"
                          step="0.0001"
                          value={parameters.kenBurnsZoomIncrement ?? ''}
                          onChange={(event) =>
                            setParameters({
                              ...parameters,
                              kenBurnsZoomIncrement: event.target.value
                                ? Number.parseFloat(event.target.value)
                                : undefined,
                            })
                          }
                        />
                        <FormControl.HelpText>
                          Per-frame zoom increase (default 0.0005).
                        </FormControl.HelpText>
                      </FormControl>

                      <FormControl>
                        <FormControl.Label>Ken Burns max zoom</FormControl.Label>
                        <TextInput
                          id="kenBurnsMaxZoom"
                          name="kenBurnsMaxZoom"
                          type="number"
                          step="0.1"
                          value={parameters.kenBurnsMaxZoom ?? ''}
                          onChange={(event) =>
                            setParameters({
                              ...parameters,
                              kenBurnsMaxZoom: event.target.value
                                ? Number.parseFloat(event.target.value)
                                : undefined,
                            })
                          }
                        />
                      </FormControl>
                    </Stack>
                  ) : null}
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </Form>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
