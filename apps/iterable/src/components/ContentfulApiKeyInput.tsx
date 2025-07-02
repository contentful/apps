import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Form,
  FormControl,
  TextInput,
  Text,
  Heading,
  HelpText,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export async function validateContentfulApiKey(apiKey: string, sdk: ConfigAppSDK) {
  if (!apiKey) {
    return false;
  }

  const url = `https://${sdk.hostnames.delivery}/spaces/${sdk.ids.space}`;
  const response: Response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  return response.ok;
}

interface ContentfulApiKeyInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  spaceId: string;
  isInvalid?: boolean;
  dataTestId?: string;
}

const ContentfulApiKeyInput = ({
  value,
  onChange,
  isInvalid = false,
  dataTestId = 'contentfulApiKey',
}: ContentfulApiKeyInputProps) => (
  <FormControl isRequired isInvalid={isInvalid}>
    <FormControl.Label>Contentful Delivery API - access token</FormControl.Label>
    <TextInput
      value={value}
      onChange={onChange}
      name="contentfulApiKey"
      testId={dataTestId}
      isInvalid={isInvalid}
      placeholder="ex. 0ab1c234DE56f..."
      type="password"
      isRequired
    />
    {isInvalid && <FormControl.ValidationMessage>Invalid API key</FormControl.ValidationMessage>}
  </FormControl>
);

export default ContentfulApiKeyInput;
