import { FC, useEffect, useState } from 'react';
import { FormControl, Switch, Checkbox, Stack, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export interface Mp4RenditionsConfig {
  enabled: boolean;
  highestResolution: boolean;
  audioOnly: boolean;
}

interface Mp4RenditionsConfigurationProps {
  mp4Config: Mp4RenditionsConfig;
  onMp4ConfigChange: (config: Mp4RenditionsConfig) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const mp4StaticRenditionsLink = 'https://www.mux.com/docs/guides/enable-static-mp4-renditions';

const Mp4RenditionsConfiguration: FC<Mp4RenditionsConfigurationProps> = ({
  mp4Config,
  onMp4ConfigChange,
  onValidationChange,
}) => {
  const [checkboxError, setCheckboxError] = useState(false);

  useEffect(() => {
    if (!mp4Config.enabled) {
      setCheckboxError(false);
      onValidationChange?.(true);
      return;
    }
    const isValid = mp4Config.highestResolution || mp4Config.audioOnly;
    setCheckboxError(!isValid);
    onValidationChange?.(isValid);
  }, [mp4Config]);

  const handleSwitch = () => {
    onMp4ConfigChange({
      enabled: !mp4Config.enabled,
      highestResolution: true,
      audioOnly: false,
    });
  };

  const handleCheckbox =
    (name: 'highestResolution' | 'audioOnly') => (e: React.ChangeEvent<HTMLInputElement>) => {
      onMp4ConfigChange({
        ...mp4Config,
        [name]: e.target.checked,
      });
    };

  return (
    <FormControl>
      <Stack flexDirection="column" spacing="spacingS">
        <Switch isChecked={mp4Config.enabled} onChange={handleSwitch}>
          MP4 Generation
        </Switch>
        <FormControl.HelpText>
          Support the generation and download of MP4 renditions for video assets.
          <TextLink
            icon={<ExternalLinkIcon />}
            variant="secondary"
            href={mp4StaticRenditionsLink}
            target="_blank"
            rel="noopener noreferrer"
          />
        </FormControl.HelpText>
        {mp4Config.enabled && (
          <Stack flexDirection="row" spacing="spacingM">
            <Checkbox
              isChecked={mp4Config.highestResolution}
              onChange={handleCheckbox('highestResolution')}
              name="highestResolution">
              Highest Resolution
            </Checkbox>
            <Checkbox
              isChecked={mp4Config.audioOnly}
              onChange={handleCheckbox('audioOnly')}
              name="audioOnly">
              Audio Only
            </Checkbox>
          </Stack>
        )}
        {checkboxError && (
          <FormControl.ValidationMessage>
            At least one option must be selected
          </FormControl.ValidationMessage>
        )}
      </Stack>
    </FormControl>
  );
};

export default Mp4RenditionsConfiguration;
