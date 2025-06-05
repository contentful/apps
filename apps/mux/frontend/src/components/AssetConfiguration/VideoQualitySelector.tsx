import { FC } from 'react';
import { FormControl, Radio, Stack, TextLink, Flex } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

const options: Record<string, string> = {
  basic: 'Lower video quality with no encoding cost. Ideal for simple video needs.',
  plus: 'High-quality video with smart encoding that adapts to content complexity.',
  premium: 'Top-tier quality for high-end content like live sports or movies.',
};

const videoQualityBaseLink = 'https://www.mux.com/docs/guides/use-video-quality-levels';

interface VideoQualitySelectorProps {
  selectedQuality: string;
  onQualityChange: (quality: string) => void;
}

export const VideoQualitySelector: FC<VideoQualitySelectorProps> = ({
  selectedQuality,
  onQualityChange,
}) => {
  return (
    <FormControl marginBottom="spacingS">
      <Stack flexDirection="column" spacing="spacingXs">
        {Object.entries(options).map(([id, description]) => (
          <Flex key={id} flexDirection="column" fullWidth>
            <Flex alignItems="flex-start" fullWidth>
              <Radio
                id={`radio${id}`}
                name="radio-controlled"
                value={id}
                isChecked={selectedQuality === id}
                onChange={() => onQualityChange(id)}>
                {String(id[0]).toUpperCase() + String(id).slice(1)}
              </Radio>
            </Flex>
            <FormControl.HelpText>
              {description}
              <TextLink
                icon={<ExternalLinkIcon />}
                variant="secondary"
                href={`${videoQualityBaseLink}#${id}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            </FormControl.HelpText>
          </Flex>
        ))}
      </Stack>
    </FormControl>
  );
};
