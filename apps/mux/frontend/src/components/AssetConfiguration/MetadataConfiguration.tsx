import { FC, useState, useEffect } from 'react';
import {
  FormControl,
  Switch,
  TextInput,
  Textarea,
  TextLink,
  Stack,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export interface MetadataConfig {
  enabled: boolean;
  standardMetadata?: {
    title?: string;
    creatorId?: string;
    externalId?: string;
  };
  customMetadata?: string;
}

interface MetadataConfigurationProps {
  metadataConfig: MetadataConfig;
  onMetadataChange: (config: MetadataConfig) => void;
  onValidationChange: (isValid: boolean) => void;
}

const metadataLink = 'https://www.mux.com/docs/guides/add-metadata-to-your-videos';

const MAX_TITLE_LENGTH = 512;
const MAX_ID_LENGTH = 128;
const MAX_CUSTOM_METADATA_LENGTH = 255;

export const MetadataConfiguration: FC<MetadataConfigurationProps> = ({
  metadataConfig,
  onMetadataChange,
  onValidationChange,
}) => {
  const [standardMetadata, setStandardMetadata] = useState<
    NonNullable<MetadataConfig['standardMetadata']>
  >(metadataConfig.standardMetadata || {});

  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    creatorId?: string;
    externalId?: string;
    customMetadata?: string;
    general?: string;
  }>({});

  const validateField = (value: string, maxLength: number): string | undefined => {
    if (value.length > maxLength) {
      return `Maximum length is ${maxLength} code points`;
    }
    return undefined;
  };

  const validateCustomMetadata = (value: string): string | undefined => {
    if (value.length > MAX_CUSTOM_METADATA_LENGTH) {
      return `Maximum length is ${MAX_CUSTOM_METADATA_LENGTH} characters`;
    }
    return undefined;
  };

  const validateAllFields = () => {
    const errors: typeof validationErrors = {};

    if (metadataConfig.enabled) {
      const hasStandardData =
        standardMetadata.title || standardMetadata.creatorId || standardMetadata.externalId;
      const hasCustomData =
        metadataConfig.customMetadata && metadataConfig.customMetadata.trim().length > 0;

      if (!hasStandardData && !hasCustomData) {
        errors.general = 'At least one metadata field must be filled';
      }

      if (standardMetadata.title) {
        errors.title = validateField(standardMetadata.title, MAX_TITLE_LENGTH);
      }
      if (standardMetadata.creatorId) {
        errors.creatorId = validateField(standardMetadata.creatorId, MAX_ID_LENGTH);
      }
      if (standardMetadata.externalId) {
        errors.externalId = validateField(standardMetadata.externalId, MAX_ID_LENGTH);
      }
      if (metadataConfig.customMetadata) {
        errors.customMetadata = validateCustomMetadata(metadataConfig.customMetadata);
      }
    }

    setValidationErrors(errors);
    const isValid = Object.values(errors).every((error) => !error);
    onValidationChange(isValid);
  };

  useEffect(() => {
    validateAllFields();
  }, [standardMetadata, metadataConfig.enabled, metadataConfig.customMetadata]);

  const handleSwitch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMetadataChange({
      ...metadataConfig,
      enabled: e.target.checked,
    });
  };

  const handleStandardMetadataChange = (
    field: keyof NonNullable<MetadataConfig['standardMetadata']>,
    value: string
  ) => {
    const newStandardMetadata = { ...standardMetadata, [field]: value };
    setStandardMetadata(newStandardMetadata);
    onMetadataChange({
      ...metadataConfig,
      standardMetadata: newStandardMetadata,
    });
  };

  const handleCustomMetadataChange = (value: string) => {
    onMetadataChange({
      ...metadataConfig,
      customMetadata: value,
    });
  };

  return (
    <>
      <FormControl>
        <Stack flexDirection="column" spacing="spacingS">
          <Switch isChecked={metadataConfig.enabled} onChange={handleSwitch}>
            Metadata
          </Switch>
          <FormControl.HelpText>
            Provides additional descriptive information about your video assets.
            <br />
            Note: This metadata may be publicly available via the video player. Do not include PII
            or sensitive information.
            <TextLink
              icon={<ExternalLinkIcon />}
              variant="secondary"
              href={metadataLink}
              target="_blank"
              rel="noopener noreferrer"
            />
          </FormControl.HelpText>
        </Stack>
      </FormControl>

      {metadataConfig.enabled && (
        <>
          {validationErrors.general && (
            <FormControl isInvalid>
              <FormControl.ValidationMessage>
                {validationErrors.general}
              </FormControl.ValidationMessage>
            </FormControl>
          )}

          <FormControl isInvalid={!!validationErrors.title}>
            <FormControl.Label>Title</FormControl.Label>
            <TextInput
              value={standardMetadata.title || ''}
              onChange={(e) => handleStandardMetadataChange('title', e.target.value)}
              placeholder="The video title"
            />
            <FormControl.HelpText>
              The video title that will be displayed in the player.
            </FormControl.HelpText>
            {validationErrors.title && (
              <FormControl.ValidationMessage>
                {validationErrors.title}
              </FormControl.ValidationMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!validationErrors.creatorId}>
            <FormControl.Label>Creator ID</FormControl.Label>
            <TextInput
              value={standardMetadata.creatorId || ''}
              onChange={(e) => handleStandardMetadataChange('creatorId', e.target.value)}
              placeholder="Identifier to track the creator of the video"
            />
            <FormControl.HelpText>
              An identifier to keep track of the creator of the video.
            </FormControl.HelpText>
            {validationErrors.creatorId && (
              <FormControl.ValidationMessage>
                {validationErrors.creatorId}
              </FormControl.ValidationMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!validationErrors.externalId}>
            <FormControl.Label>External ID</FormControl.Label>
            <TextInput
              value={standardMetadata.externalId || ''}
              onChange={(e) => handleStandardMetadataChange('externalId', e.target.value)}
              placeholder="Identifier to link the video to your own data"
            />
            <FormControl.HelpText>
              An identifier to link the video to your own data.
            </FormControl.HelpText>
            {validationErrors.externalId && (
              <FormControl.ValidationMessage>
                {validationErrors.externalId}
              </FormControl.ValidationMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!validationErrors.customMetadata}>
            <FormControl.Label>Custom Metadata</FormControl.Label>
            <Textarea
              value={metadataConfig.customMetadata || ''}
              onChange={(e) => handleCustomMetadataChange(e.target.value)}
              placeholder="Enter your custom metadata"
              rows={5}
            />
            <FormControl.HelpText>This will be stored with your video.</FormControl.HelpText>
            {validationErrors.customMetadata && (
              <FormControl.ValidationMessage>
                {validationErrors.customMetadata}
              </FormControl.ValidationMessage>
            )}
          </FormControl>
        </>
      )}
    </>
  );
};

export default MetadataConfiguration;
