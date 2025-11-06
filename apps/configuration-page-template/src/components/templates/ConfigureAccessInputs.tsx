import React, { useState } from 'react';
import {
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  Subheading,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export default function ConfigureAccessInputs() {
  const [apiKey, setApiKey] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  return (
    <Flex flexDirection="column" gap="spacing3Xl" fullWidth>
      <Flex flexDirection="column" gap="spacingL">
        <Flex flexDirection="column" gap="spacingS">
          <Subheading marginBottom="none">Configure access</Subheading>
          <Paragraph marginBottom="none">Section subtitle with basic instructions</Paragraph>
        </Flex>

        <Form>
          <FormControl isRequired marginBottom="spacingL">
            <FormControl.Label>Your key</FormControl.Label>
            <TextInput
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-...dsvb"
            />
            <FormControl.HelpText>
              Help text with{' '}
              <TextLink href="#" icon={<ExternalLinkIcon />} alignIcon="end">
                link out
              </TextLink>
            </FormControl.HelpText>
          </FormControl>

          <FormControl isRequired>
            <FormControl.Label>Your website URL</FormControl.Label>
            <TextInput
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="http://www..."
            />
            <FormControl.HelpText>Help text</FormControl.HelpText>
          </FormControl>
        </Form>
      </Flex>
    </Flex>
  );
}
