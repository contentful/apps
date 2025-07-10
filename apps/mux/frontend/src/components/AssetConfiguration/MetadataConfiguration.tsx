import { FC, useState, useEffect } from 'react';
import { FormControl, TextInput, TextLink, Stack } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { FieldExtensionSDK } from '@contentful/app-sdk';

export interface MetadataConfig {
  standardMetadata?: {
    title?: string;
    externalId?: string;
  };
}

interface MetadataConfigurationProps {
  metadataConfig: MetadataConfig;
  onMetadataChange: (config: MetadataConfig) => void;
  onValidationChange: (isValid: boolean) => void;
  sdk: FieldExtensionSDK;
}

const metadataLink = 'https://www.mux.com/docs/guides/add-metadata-to-your-videos';

const MAX_TITLE_LENGTH = 512;

export const MetadataConfiguration: FC<MetadataConfigurationProps> = ({
  metadataConfig,
  onMetadataChange,
  onValidationChange,
  sdk,
}) => {
  const [standardMetadata, setStandardMetadata] = useState<
    NonNullable<MetadataConfig['standardMetadata']>
  >(metadataConfig.standardMetadata || {});

  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
  }>({});

  useEffect(() => {
    const TITLE_FIELD_ID = 'title';
    const titleField = sdk.entry.fields[TITLE_FIELD_ID];

    if (!titleField) {
      console.debug(`No ${TITLE_FIELD_ID} field detected. Skipping sync.`);
      return;
    }

    const syncFromTitle = (newVal: string) => {
      if (newVal !== standardMetadata.title) {
        handleStandardMetadataChange('title', newVal);
      }
    };

    syncFromTitle(titleField.getValue());

    const detach = titleField.onValueChanged((newValue) => {
      syncFromTitle(newValue);
    });

    return () => {
      detach();
    };
  }, [sdk.entry.fields]);

  useEffect(() => {
    const entryId = sdk.entry.getSys().id;
    const fieldId = sdk.field.id;
    const externalId = `${entryId}:${fieldId}`;
    if (standardMetadata.externalId !== externalId) {
      setStandardMetadata((prev) => ({
        ...prev,
        externalId,
      }));
    }
  }, [sdk.entry, sdk.field]);

  useEffect(() => {
    onMetadataChange({
      ...metadataConfig,
      standardMetadata,
    });
  }, [standardMetadata]);

  const validateField = (value: string, maxLength: number): string | undefined => {
    if (value.length > maxLength) {
      return `Maximum length is ${maxLength} code points`;
    }
    return undefined;
  };

  const validateAllFields = () => {
    const errors: typeof validationErrors = {};

    if (standardMetadata.title) {
      errors.title = validateField(standardMetadata.title, MAX_TITLE_LENGTH);
    }

    setValidationErrors(errors);
    const isValid = Object.values(errors).every((error) => !error);
    onValidationChange(isValid);
  };

  useEffect(() => {
    validateAllFields();
  }, [standardMetadata]);

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

  return (
    <>
      <FormControl>
        <Stack flexDirection="column" spacing="spacingS">
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
          <FormControl.ValidationMessage>{validationErrors.title}</FormControl.ValidationMessage>
        )}
      </FormControl>
    </>
  );
};

export default MetadataConfiguration;
