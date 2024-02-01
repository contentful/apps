import { Dispatch } from 'react';
import { Box, Button, Card, Flex, Paragraph, Subheading } from '@contentful/f36-components';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { loginRequest } from '@configs/authConfig';
import { accessSection } from '@constants/configCopy';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { HyperLink } from '@contentful/integration-frontend-toolkit/components';
import { styles } from './MsAuthorization.styles';
import { ParameterAction, actions } from '@components/config/parameterReducer';
import { useCustomApi } from '@hooks/useCustomApi';
import { AppInstallationParameters } from '@customTypes/configPage';
import { useSDK } from '@contentful/react-apps-toolkit';

interface Props {
  dispatch: Dispatch<ParameterAction>;
  parameters: AppInstallationParameters;
  isAppInstalled: boolean;
}

const MsAuthorization = (props: Props) => {
  const { dispatch, parameters, isAppInstalled } = props;
  const { instance, accounts } = useMsal();
  const customApi = useCustomApi();
  const sdk = useSDK();
  const { logout, login, teamsAppInfo, teamsAppLink, description } = accessSection;

  const handleLogin = async () => {
    try {
      const authResult = await instance.loginPopup(loginRequest);
      if (!isAppInstalled) {
        await customApi.saveConfiguration({ ...parameters, tenantId: authResult.tenantId });
        dispatch({
          type: actions.UPDATE_TENANT_ID,
          payload: authResult.tenantId,
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to authenticate with Microsoft';
      sdk.notifier.error(message);
      console.log(e);
    }
  };

  const handleLogout = async () => {
    console.log('logout');
  };

  return (
    <>
      <AuthenticatedTemplate>
        <Card padding="large">
          <Flex justifyContent="space-between">
            <Flex flexDirection="column">
              <Subheading marginBottom="none">{accounts[0]?.name}</Subheading>
              <Paragraph marginBottom="none">{accounts[0]?.username}</Paragraph>
            </Flex>
            <Button onClick={() => handleLogout()}>{logout}</Button>
          </Flex>
        </Card>
        <Flex
          marginBottom="spacingS"
          marginTop="spacingS"
          alignItems="center"
          className={styles.logo}>
          <TeamsLogo />
          <Box marginLeft="spacingXs">
            <HyperLink
              body={teamsAppInfo}
              substring={teamsAppLink}
              // TODO: update link to app documentation
              href={'https://www.contentful.com/help/apps-at-contentful/'}
            />
          </Box>
        </Flex>
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <Paragraph>{description}</Paragraph>
        <Box>
          <Button onClick={() => handleLogin()}>{login}</Button>
        </Box>
      </UnauthenticatedTemplate>
    </>
  );
};

export default MsAuthorization;
