import React, { useCallback, useState, useEffect } from 'react';
import {
  Heading,
  Form,
  FormControl,
  TextInput,
  Textarea,
  Flex,
  Select,
} from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';

const ConfigScreen = () => {
  const [parameters, setParameters] = useState({});
  const sdk = useSDK();
  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <Heading>ChatGPT</Heading>
        <FormControl>
          <FormControl.Label>Machine Learning Model</FormControl.Label>
          <Select
            value={parameters.model || 'gpt-3.5-turbo'}
            onChange={(e) => setParameters({ ...parameters, model: e.target.value })}>
            <Select.Option value="gpt-3.5-turbo">gpt-3.5-turbo</Select.Option>
            <Select.Option value="gpt-3.5-turbo-0301">gpt-3.5-turbo-0301</Select.Option>
            <Select.Option value="davinci">text-davinci-003</Select.Option>
          </Select>
          <FormControl.HelpText>
            Different models generate different results! gpt-3.5-turbo is the latest and most
            powerful AI model from OpenAI. If your results are too often not what you expected, you
            might consider using a different model. Also try tweaking the profile below for optimal
            output.
          </FormControl.HelpText>
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label>OpenAI API-key</FormControl.Label>
          <TextInput
            value={parameters.key || ''}
            type="text"
            name="apikey"
            placeholder="sk-...4svb"
            size="small"
            onChange={(e) => setParameters({ ...parameters, key: e.target.value })}
          />
          <FormControl.HelpText>Provide your API key registered with OpenAI</FormControl.HelpText>
          {!parameters?.key && (
            <FormControl.ValidationMessage>
              You can visit the website of OpenAI and register for an API key. Provide the API-key
              here.
            </FormControl.ValidationMessage>
          )}
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label>Describe your profile</FormControl.Label>
          <Textarea
            style={{ minHeight: '140px' }}
            value={parameters.profile || ''}
            type="text"
            name="profile"
            placeholder="Example: we sell online clothing for the conscious consumer. We care about the planet and make sure our products are made in a sustainable way. Our customers are young and care about the environment. We are progressive, creative, fun and also serious about our business."
            onChange={(e) => setParameters({ ...parameters, profile: e.target.value })}
          />
          <FormControl.HelpText>
            ChatGPT can take a certain profile in which it will generate content. If you leave this
            profile empty, content suggestions will most likely not be relevant. Write the profile
            as if you are describing you're online business.
          </FormControl.HelpText>
        </FormControl>
      </Form>
    </Flex>
  );
};
export default ConfigScreen;
