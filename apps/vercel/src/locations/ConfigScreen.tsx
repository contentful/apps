import { useCallback, useState, useEffect, ChangeEvent } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  FormControl,
  Heading,
  HelpText,
  Paragraph,
  Stack,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { styles } from '../components/config-screen/ConfigScreen.styles';
import VercelIcon from '../components/common/VercelIcon';

export interface AppInstallationParameters {
  accessToken?: string;
}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [accessToken, setAccessToken] = useState<string>('');

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const parametersToSave = {
      ...parameters,
      accessToken,
    };

    setParameters(parametersToSave);

    return {
      parameters: parametersToSave,
      targetState: currentState,
    };
  }, [parameters, sdk, accessToken]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
        setAccessToken(currentParameters.accessToken);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleAccessTokenChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAccessToken(e.target.value);
  };

  return (
    <>
      <Box className={styles.background} />
      <Box className={styles.body}>
        <Box>
          <Heading>Set Up Vercel</Heading>
          <Paragraph>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.
          </Paragraph>
        </Box>
        <Stack spacing="spacingL" flexDirection="column">
          <Box style={styles.box}>
            <FormControl id="accessToken" isRequired={true}>
              <FormControl.Label aria-label="accessToken" htmlFor="accessToken">
                Vercel Access Token
              </FormControl.Label>
              <TextInput
                testId="accessToken"
                spellCheck={false}
                name="accessToken"
                type="password"
                placeholder={'ex. atE2sdftcIp01O1isdfXc3QTdT4...'}
                value={accessToken}
                onChange={handleAccessTokenChange}
              />
              <HelpText>
                Follow{' '}
                <TextLink
                  icon={<ExternalLinkIcon />}
                  alignIcon="end"
                  href="https://vercel.com/docs/rest-api#creating-an-access-token"
                  target="_blank"
                  rel="noopener noreferrer">
                  these detailed instructions
                </TextLink>{' '}
                to create an access token in the vercel dashboard.
              </HelpText>
            </FormControl>
          </Box>
        </Stack>
      </Box>
      <Box style={styles.icon}>
        <Flex alignItems="center" justifyContent="center">
          <VercelIcon />
        </Flex>
      </Box>
    </>
  );
};

export default ConfigScreen;
