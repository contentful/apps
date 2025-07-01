import { useState, useEffect } from 'react';
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
import { useSDK } from '@contentful/react-apps-toolkit';
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
  spaceId,
  isInvalid = false,
  dataTestId = 'contentfulApiKey',
}: ContentfulApiKeyInputProps) => (
  <>
    <Heading as="h3" marginBottom="spacingXs">
      Configure access
    </Heading>
    <HelpText marginBottom="spacingS">
      Input the Contentful Delivery API - access token that Iterable will use to request your
      content via API at send time.
    </HelpText>
    <Box marginBottom="spacingM">
      <TextLink
        href={`https://app.contentful.com/spaces/${spaceId}/api/keys`}
        target="_blank"
        rel="noopener noreferrer"
        alignIcon="end"
        icon={<ExternalLinkIcon />}>
        Manage API keys
      </TextLink>
    </Box>
    <FormControl isRequired>
      <FormControl.Label>Contentful Delivery API - access token</FormControl.Label>
      <TextInput
        value={value}
        name="contentfulApiKey"
        data-testid={dataTestId}
        isInvalid={isInvalid}
        placeholder="ex. 0ab1c234DE56f..."
        type="password"
        onChange={onChange}
        isRequired
      />
      {isInvalid && <FormControl.ValidationMessage>Invalid API key</FormControl.ValidationMessage>}
    </FormControl>
  </>
);

export default ContentfulApiKeyInput;
