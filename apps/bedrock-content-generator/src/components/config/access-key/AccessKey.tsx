import HyperLink from '@components/common/HyperLink/HyperLink';
import { FormControl, TextInput } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { ChangeEvent, Dispatch } from 'react';
import { AccessKeyText } from '../configText';
import { ParameterReducer } from '../parameterReducer';

interface Props {
  accessKeyID: string;
  secretAccessKey: string;
  region: string;
  isInvalid: boolean;
  accessKeyIdInput: string;
  secretAccessKeyInput: string;
  onAccessKeyIdChange: (value: string) => void;
  onSecretAccessKeyChange: (value: string) => void;
  dispatch: Dispatch<ParameterReducer>;
}

const AccessKey = ({
  accessKeyIdInput,
  secretAccessKeyInput,
  onAccessKeyIdChange,
  onSecretAccessKeyChange,
}: Props) => {
  return (
    <>
      <FormControl isRequired>
        <FormControl.Label>{AccessKeyText.accessKeyIDTitle}</FormControl.Label>
        <TextInput
          value={accessKeyIdInput}
          type="text"
          name="accessKeyID"
          placeholder="Enter new Access Key ID (leave blank to keep existing)"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onAccessKeyIdChange(e.target.value)}
        />
      </FormControl>
      <FormControl isRequired>
        <FormControl.Label>{AccessKeyText.secretAccessKeyTitle}</FormControl.Label>
        <TextInput
          value={secretAccessKeyInput}
          type="password"
          name="secretAccessKey"
          placeholder="Enter new Secret Access Key (leave blank to keep existing)"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSecretAccessKeyChange(e.target.value)}
        />
        <FormControl.HelpText>
          <HyperLink
            body={AccessKeyText.helpText}
            substring={AccessKeyText.linkSubstring}
            hyperLinkHref={AccessKeyText.link}
            icon={<ExternalLinkIcon />}
            alignIcon="end"
          />
        </FormControl.HelpText>
      </FormControl>
    </>
  );
};

export default AccessKey;
