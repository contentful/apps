import React, { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  TextInput,
  FormControl,
  Pill,
} from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Autocomplete } from '@contentful/f36-autocomplete';
import { ContentTypeProps } from 'contentful-management';
import { getStringMatch } from '@contentful/f36-utils';

// Update these parameters to match those configured in your App Definition
export interface AppInstallationParameters {
  /*
   * Because the `apiKey` parameter is defined as type `Secret` in the Parameter Definition,
   * it will only be available as a redacted string on the frontend.
   * Save it as you would any other parameter, but remember that only the
   * App Identity (a Contentful Function or a backend app authenticating using the app's private App Key)
   * will be able to access the raw value to use it for API requests.
   */
  apiKey?: string;
  contentTypes?: string;
}

const ConfigScreen: React.FC = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters: { ...parameters },
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters);
      }

      // load all the content types in this environment to allow the user to select which ones to autotag
      const allContentTypes = await sdk.cma.contentType.getMany({});
      setContentTypes(allContentTypes.items);
      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParameters((prev) => ({ ...prev, apiKey: e.target.value }));
  };

  // selected content types are stored as a comma delimeted string of content type ids
  const handleContentTypeSelect = (item: ContentTypeProps) => {
    setParameters((prev) => {
      const contentTypeIds = prev.contentTypes?.split(',') || [];
      const updatedContentTypes = contentTypeIds.includes(item.sys.id)
        ? contentTypeIds.filter((id) => id !== item.sys.id).join(',')
        : [...contentTypeIds, item.sys.id].join(',');

      return { ...prev, contentTypes: updatedContentTypes };
    });
  };

  const handleContentTypeRemove = (id: string) => {
    setParameters((prev) => ({
      ...prev,
      contentTypes:
        prev.contentTypes
          ?.split(',')
          .filter((contentType) => contentType !== id)
          .join(',') || '',
    }));
  };

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <Heading>App Config</Heading>
        <Paragraph>Welcome to your Contentful app. This is your config page.</Paragraph>
        <FormControl>
          <FormControl.Label htmlFor="apiKey">OpenAI API Key</FormControl.Label>
          <TextInput
            type="password"
            id="apiKey"
            value={parameters.apiKey || ''}
            onChange={handleApiKeyChange}
          />
        </FormControl>
        <FormControl>
          <FormControl.Label>Content Types to Autotag</FormControl.Label>
          {/* Using an Autocomplete component from Forma36 ensures your users have a pleasant experience searching for the Content Types they want to select */}
          <Autocomplete
            id="content-type"
            items={contentTypes}
            itemToString={(item) => `${item.name} • ${item.sys.id}`}
            onSelectItem={handleContentTypeSelect}
            renderItem={(item, inputValue) => {
              const { before, match, after } = getStringMatch(item.name, inputValue);
              return (
                <>
                  {before}
                  <b>{match}</b>
                  {after} {!inputValue || match ? `• ${item.sys.id}` : ''}
                </>
              );
            }}
          />
          <FormControl.HelpText>
            Entries of these content types will be automatically tagged using{' '}
            <a href="https://openai.com/index/hello-gpt-4o/">GPT-4o</a>.
            {(parameters.contentTypes || '')
              .split(',')
              .map(
                (id) =>
                  id && (
                    <Pill
                      key={id}
                      style={{ margin: '4px' }}
                      label={id}
                      onClose={() => handleContentTypeRemove(id)}
                    />
                  )
              )}
          </FormControl.HelpText>
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
