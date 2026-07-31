import HyperLink from '@components/common/HyperLink/HyperLink';
import { ConfigErrors } from '@components/config/configText';
import { FormControl, TextInput } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { ChangeEvent, Dispatch } from 'react';
import { AccessKeyText } from '../configText';
import { ParameterAction, ParameterReducer } from '../parameterReducer';

interface Props {
  accessKeyID: string;
  secretAccessKey: string;
  region: string;
  isInvalid: boolean;
  dispatch: Dispatch<ParameterReducer>;
}

const AccessKey = ({ accessKeyID, secretAccessKey, isInvalid, dispatch }: Props) => {
  const handleAccessKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: ParameterAction.UPDATE_CREDENTIALS,
      value: {
        accessKeyId: e.target.value,
        secretAccessKey,
      },
      isValid: e.target.value.length > 0 && secretAccessKey.length > 0,
    });
  };

  const handleSecretKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: ParameterAction.UPDATE_CREDENTIALS,
      value: {
        accessKeyId: accessKeyID,
        secretAccessKey: e.target.value,
      },
      isValid: accessKeyID.length > 0 && e.target.value.length > 0,
    });
  };

  return (
    <>
      <FormControl isRequired>
        <FormControl.Label>{AccessKeyText.accessKeyIDTitle}</FormControl.Label>
        <TextInput
          value={accessKeyID}
          type="password"
          name="accessKeyID"
          placeholder="Enter new Access Key ID (leave blank to keep existing)"
          onChange={handleAccessKeyChange}
        />
        {isInvalid && !accessKeyID && (
          <FormControl.ValidationMessage>
            {ConfigErrors.missingAccessKeyID}
          </FormControl.ValidationMessage>
        )}
      </FormControl>
      <FormControl isRequired>
        <FormControl.Label>{AccessKeyText.secretAccessKeyTitle}</FormControl.Label>
        <TextInput
          value={secretAccessKey}
          type="password"
          name="secretAccessKey"
          placeholder="Enter new Secret Access Key (leave blank to keep existing)"
          onChange={handleSecretKeyChange}
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
        {isInvalid && !secretAccessKey && (
          <FormControl.ValidationMessage>
            {ConfigErrors.missingSecretAccessKey}
          </FormControl.ValidationMessage>
        )}
      </FormControl>
    </>
  );
};

export default AccessKey;
