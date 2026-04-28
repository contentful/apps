import { useEffect, useState, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Flex, Form, FormControl, Heading, Paragraph, TextInput } from '@contentful/f36-components';

interface AppInstallationParameters {
  scoringLambdaUrl?: string;
}

const ConfigScreen = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdk = useSDK<any>();
  const [lambdaUrl, setLambdaUrl] = useState('');

  useEffect(() => {
    sdk.app.onConfigure(async () => {
      const params: AppInstallationParameters = { scoringLambdaUrl: lambdaUrl.trim() };
      return { parameters: params };
    });
    sdk.app.setReady();
  }, [sdk, lambdaUrl]);

  useEffect(() => {
    void (sdk.app.getParameters() as Promise<AppInstallationParameters | null>).then((params) => {
      if (params?.scoringLambdaUrl) setLambdaUrl(params.scoringLambdaUrl);
    });
  }, [sdk]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLambdaUrl(e.target.value);
  }, []);

  return (
    <Flex flexDirection="column" margin="spacingL" style={{ maxWidth: 600 }}>
      <Heading>Google Docs Eval — Configuration</Heading>
      <Paragraph>
        This app lists completed Google Docs agent runs in this space and scores them using an AI
        judge backed by AWS Bedrock. Enter the URL of your deployed scoring Lambda below.
      </Paragraph>

      <Form>
        <FormControl isRequired>
          <FormControl.Label>Scoring Lambda URL</FormControl.Label>
          <TextInput
            value={lambdaUrl}
            onChange={handleChange}
            placeholder="https://google-docs-eval-test.api.ctf-apps.com"
          />
          <FormControl.HelpText>
            The base URL of the deployed Lambda (no trailing slash). See the README for deployment
            instructions.
          </FormControl.HelpText>
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
