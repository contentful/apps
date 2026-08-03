import { ChangeEvent } from 'react';
import { FormControl, TextInput } from '@contentful/f36-components';
import { APIKeyText } from '../configText';
import HyperLink from '@components/common/HyperLink/HyperLink';
import { ExternalLinkIcon } from '@contentful/f36-icons';

interface Props {
  keyInput: string;
  onKeyChange: (value: string) => void;
}

const APIKey = ({ keyInput, onKeyChange }: Props) => {
  return (
    <FormControl isRequired>
      <FormControl.Label>{APIKeyText.title}</FormControl.Label>
      <TextInput
        value={keyInput}
        type="password"
        name="apikey"
        placeholder="Enter new API key (leave blank to keep existing)"
        onChange={(e: ChangeEvent<HTMLInputElement>) => onKeyChange(e.target.value)}
      />
      <FormControl.HelpText>
        <HyperLink
          body={APIKeyText.helpText}
          substring={APIKeyText.linkSubstring}
          hyperLinkHref={APIKeyText.link}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </FormControl.HelpText>
    </FormControl>
  );
};

export default APIKey;
