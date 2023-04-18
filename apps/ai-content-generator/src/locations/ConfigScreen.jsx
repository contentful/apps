import React, { useCallback, useState, useEffect } from 'react';
import {
  Badge,
  Flex,
  Form,
  FormControl,
  Note,
  Select,
  Textarea,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';
import tokens from '@contentful/f36-tokens';

const ConfigScreen = () => {
  const [parameters, setParameters] = useState({});
  const [apiKey, setApiKey] = useState('');
  const [editing, setEditing] = useState(false);
  const [isBeta, setIsBeta] = useState(false);
  const sdk = useSDK();
  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    setApiKey('');
    setEditing(false);
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const currentParameters = await sdk.app.getParameters();
      if (!isMounted) return;
      if (currentParameters) {
        setParameters(currentParameters);
        setIsBeta(!!currentParameters.model?.match(/gpt-4/));
      }
      sdk.app.setReady();
    })();

    return () => {
      isMounted = false;
    };
  }, [sdk]);

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <FormControl isRequired>
          <FormControl.Label>OpenAI API key</FormControl.Label>
          {editing ? (
            <TextInput
              value={apiKey}
              type="text"
              name="apikey"
              placeholder="sk-...4svb"
              onChange={(e) => {
                setApiKey(e.target.value);
                setParameters({ ...parameters, key: e.target.value });
              }}
              onBlur={(e) => setEditing(false)}
            />
          ) : (
            <TextInput
              isReadOnly={true}
              value={parameters.key ? parameters.key.replace(/.(?=.{4,}$)/g, '*') : ''}
              type="text"
              name="apikey"
              placeholder="sk-...4svb"
              onClick={() => setEditing(true)}
            />
          )}
          <FormControl.HelpText>Provide your API key registered with OpenAI</FormControl.HelpText>
          {!parameters?.key && (
            <FormControl.ValidationMessage>
              You can visit the website of OpenAI and register for an API key. Provide the API key
              here.
            </FormControl.ValidationMessage>
          )}
        </FormControl>
        <FormControl>
          <FormControl.Label>Describe your profile</FormControl.Label>
          <Textarea
            rows={15}
            value={parameters.profile || ''}
            type="text"
            name="profile"
            placeholder="Example: we sell online clothing for the conscious consumer. We care about the planet and make sure our products are made in a sustainable way. Our customers are young and care about the environment. We are progressive, creative, fun and also serious about our business."
            onChange={(e) => setParameters({ ...parameters, profile: e.target.value })}
          />
          <FormControl.HelpText>
            AI Content Generator can use a profile you provide to generate targeted content. If you
            leave this profile empty, content suggestions will most likely not be relevant. Write
            the profile as if you are describing your online business.
          </FormControl.HelpText>
        </FormControl>
        <FormControl>
          <FormControl.Label>Machine Learning Model</FormControl.Label>
          <Select
            value={parameters.model || 'gpt-3.5-turbo'}
            onChange={(e) => {
              setParameters({ ...parameters, model: e.target.value });
              setIsBeta(!!e.target.value.match(/gpt-4/));
            }}>
            <Select.Option value="gpt-4">gpt-4</Select.Option>
            <Select.Option value="gpt-4-0314">gpt-4-0314</Select.Option>
            <Select.Option value="gpt-3.5-turbo">gpt-3.5-turbo (recommended)</Select.Option>
            <Select.Option value="gpt-3.5-turbo-0301">gpt-3.5-turbo-0301</Select.Option>
          </Select>
          {isBeta && (
            <Note variant="warning" marginTop="spacingS">
              <Badge
                style={{
                  float: 'right',
                  marginLeft: tokens.spacingM,
                  marginBottom: tokens.spacingM,
                }}
                variant="warning">
                Limited Beta
              </Badge>
              According to the provider, GPT-4 is currently in a limited beta and only accessible to
              those who have been granted access. Please{' '}
              <TextLink href="https://openai.com/waitlist/gpt-4" target="_blank">
                join their waitlist
              </TextLink>{' '}
              to get access when capacity is available.
            </Note>
          )}
          <FormControl.HelpText>
            According to the provider, for many basic tasks, the difference between GPT-4 and
            GPT-3.5 models is not significant. However, in more complex reasoning situations, GPT-4
            is much more capable than any previous models.
          </FormControl.HelpText>
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
