import { FC } from 'react';
import { FormControl, Checkbox, Stack, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export interface Mp4RenditionsConfig {
  highestResolution: boolean;
  audioOnly: boolean;
}

interface Mp4RenditionsConfigurationProps {
  mp4Config: Mp4RenditionsConfig;
  onMp4ConfigChange: (config: Mp4RenditionsConfig) => void;
}

const mp4StaticRenditionsLink = 'https://www.mux.com/docs/guides/enable-static-mp4-renditions';

const Mp4RenditionsConfiguration: FC<Mp4RenditionsConfigurationProps> = ({
  mp4Config,
  onMp4ConfigChange,
}) => {
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
      </Stack>
    </FormControl>
  );
};

export default Mp4RenditionsConfiguration;
