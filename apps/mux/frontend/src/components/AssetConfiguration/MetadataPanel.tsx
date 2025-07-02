import { FC, useState, useEffect } from 'react';
import {
  FormControl,
  TextInput,
  Textarea,
  TextLink,
  Form,
  Button,
  Note,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { MuxContentfulObject } from '../../util/types';
import { FieldExtensionSDK } from '@contentful/app-sdk';

const metadataLink = 'https://www.mux.com/docs/guides/add-metadata-to-your-videos';

const MAX_TITLE_LENGTH = 512;
const MAX_ID_LENGTH = 128;
const MAX_CUSTOM_METADATA_LENGTH = 255;

interface MetadataPanelProps {
  asset: MuxContentfulObject;
  onSubmit: (metadata: {
    standardMetadata: {
      title?: string;
      creatorId?: string;
      externalId?: string;
    };
    customMetadata?: string;
  }) => void;
  sdk: FieldExtensionSDK;
}

export const MetadataPanel: FC<MetadataPanelProps> = ({ asset, onSubmit, sdk }) => {
  const [standardMetadata, setStandardMetadata] = useState({
    title: asset.meta?.title || '',
    creatorId: asset.meta?.creator_id || '',
    externalId: asset.meta?.external_id || '',
  });

  const [hasTitleField, setHasTitleField] = useState(false);

  const [customMetadata, setCustomMetadata] = useState(asset.passthrough || '');

  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    creatorId?: string;
    externalId?: string;
    customMetadata?: string;
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

    if (standardMetadata.title) {
      errors.title = validateField(standardMetadata.title, MAX_TITLE_LENGTH);
    }
    if (standardMetadata.creatorId) {
      errors.creatorId = validateField(standardMetadata.creatorId, MAX_ID_LENGTH);
    }
    if (standardMetadata.externalId) {
      errors.externalId = validateField(standardMetadata.externalId, MAX_ID_LENGTH);
    }
    if (customMetadata) {
      errors.customMetadata = validateCustomMetadata(customMetadata);
    }

    setValidationErrors(errors);
    return Object.values(errors).every((error) => !error);
  };

  useEffect(() => {
    validateAllFields();
  }, [standardMetadata, customMetadata]);

  useEffect(() => {
    const TITLE_FIELD_ID = 'title';
    const titleField = sdk.entry.fields[TITLE_FIELD_ID];

    if (!titleField) {
      console.debug(`No ${TITLE_FIELD_ID} field detected. Skipping sync.`);
      setHasTitleField(false);
      return;
    }

    setHasTitleField(true);

    const syncFromTitle = (newVal: string) => {
      if (newVal !== standardMetadata.title) {
        setStandardMetadata((prev) => ({ ...prev, title: newVal }));
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateAllFields()) {
      onSubmit({
        standardMetadata,
        customMetadata: customMetadata || undefined,
      });
    }
  };

  const hasErrors = Object.values(validationErrors).some((error) => error);

  return (
    <Form onSubmit={handleSubmit}>
      <FormControl isInvalid={!!validationErrors.title}>
        <FormControl.Label>Title</FormControl.Label>
        <TextInput
          value={standardMetadata.title}
          onChange={(e) => setStandardMetadata({ ...standardMetadata, title: e.target.value })}
          placeholder="The video title"
          isDisabled={hasTitleField}
        />
        {hasTitleField && (
          <FormControl.HelpText>
            This field is synchronized with the "Title" field of the content model.
            <br />
            To modify the title, update the "Title" field in the main model.
          </FormControl.HelpText>
        )}
        {validationErrors.title && (
          <FormControl.ValidationMessage>{validationErrors.title}</FormControl.ValidationMessage>
        )}
      </FormControl>

      <FormControl isInvalid={!!validationErrors.creatorId}>
        <FormControl.Label>Creator ID</FormControl.Label>
        <TextInput
          value={standardMetadata.creatorId}
          onChange={(e) => setStandardMetadata({ ...standardMetadata, creatorId: e.target.value })}
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
          value={standardMetadata.externalId}
          placeholder="Identifier to link the video to your own data"
          isDisabled={true}
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
          value={customMetadata}
          onChange={(e) => setCustomMetadata(e.target.value)}
          placeholder="Enter your custom metadata"
          rows={5}
        />
        {validationErrors.customMetadata && (
          <FormControl.ValidationMessage>
            {validationErrors.customMetadata}
          </FormControl.ValidationMessage>
        )}
      </FormControl>

      <Note variant="neutral">
        Provides additional descriptive information about your video assets.
        <br />
        Note: This metadata may be publicly available via the video player. Do not include PII or
        sensitive information.
        <TextLink
          icon={<ExternalLinkIcon />}
          variant="secondary"
          href={metadataLink}
          target="_blank"
          rel="noopener noreferrer"
        />
      </Note>

      <br />

      <Button variant="secondary" type="submit" isDisabled={hasErrors}>
        Submit
      </Button>
    </Form>
  );
};

export default MetadataPanel;
