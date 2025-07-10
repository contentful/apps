import { FC, useState } from 'react';
import { FormControl, TextInput, TextLink, Form, Note } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { MuxContentfulObject } from '../../util/types';

const metadataLink = 'https://www.mux.com/docs/guides/add-metadata-to-your-videos';

const MAX_TITLE_LENGTH = 512;

interface MetadataPanelProps {
  asset: MuxContentfulObject;
  onUpdateMetadata: (metadata: {
    standardMetadata: {
      title?: string;
    };
  }) => void;
}

export const MetadataPanel: FC<MetadataPanelProps> = ({ asset, onUpdateMetadata }) => {
  const pendingMetadata = asset.pendingActions?.update?.find(
    (action) => action.type === 'metadata' && action.data && typeof action.data.title === 'string'
  );
  const initialTitle = pendingMetadata?.data?.title ?? asset.meta?.title ?? '';

  const [standardMetadata, setStandardMetadata] = useState({
    title: initialTitle,
  });

  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
  }>({});

  const validateField = (value: string, maxLength: number): string | undefined => {
    if (value.length > maxLength) {
      return `Maximum length is ${maxLength} code points`;
    }
    return undefined;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const error = validateField(newTitle, MAX_TITLE_LENGTH);

    setStandardMetadata({ title: newTitle });
    setValidationErrors({ title: error });

    if (!error) {
      onUpdateMetadata({ standardMetadata: { title: newTitle } });
    }
  };

  return (
    <Form>
      <FormControl isInvalid={!!validationErrors.title}>
        <FormControl.Label>Asset Title</FormControl.Label>
        <TextInput
          value={standardMetadata.title}
          onChange={handleTitleChange}
          placeholder="The video title"
        />
        <FormControl.HelpText>
          The video title that will be displayed in the player.
        </FormControl.HelpText>
        {validationErrors.title && (
          <FormControl.ValidationMessage>{validationErrors.title}</FormControl.ValidationMessage>
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
    </Form>
  );
};

export default MetadataPanel;
