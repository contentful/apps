import { Dispatch } from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  ModalLauncher,
  Paragraph,
  Subheading,
} from '@contentful/f36-components';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@configs/authConfig';
import { accessSection } from '@constants/configCopy';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { HyperLink } from '@contentful/integration-frontend-toolkit/components';
import { styles } from './AccessSection.styles';
import { ParameterAction, actions } from '@components/config/parameterReducer';
import { useCustomApi } from '@hooks/useCustomApi';
import { AppInstallationParameters } from '@customTypes/configPage';
import { useSDK } from '@contentful/react-apps-toolkit';
import DisconnectModal from '@components/config/DisconnectModal/DisconnectModal';

interface Props {
  dispatch: Dispatch<ParameterAction>;
  parameters: AppInstallationParameters;
  isAppInstalled: boolean;
}

const AccessSection = (props: Props) => {
  const { dispatch, parameters, isAppInstalled } = props;
  const { instance, accounts, inProgress } = useMsal();
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

  const handleLogout = () => {
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <DisconnectModal
          isShown={isShown}
          handleCancel={() => {
            onClose(true);
          }}
          handleDisconnect={async () => {
            onClose(true);
            await instance.logoutPopup({
              mainWindowRedirectUri: '/',
            });
          }}
        />
      );
    });
  };

  const accessComponent = () => {
    // Display if not authorized and if logout is not in progress
    if (!accounts.length && inProgress !== 'logout') {
      return (
        <>
          <Paragraph>{description}</Paragraph>
          <Box>
            <Button
              onClick={() => handleLogin()}
              isDisabled={inProgress === 'login'}
              isLoading={inProgress === 'login'}>
              {login}
            </Button>
          </Box>
        </>
      );
    } else {
      return (
        <>
          <Card padding="large">
            <Flex justifyContent="space-between">
              <Flex flexDirection="column">
                <Subheading marginBottom="none">{accounts[0]?.name}</Subheading>
                <Paragraph marginBottom="none">{accounts[0]?.username}</Paragraph>
              </Flex>
              <Button
                onClick={() => handleLogout()}
                isDisabled={inProgress === 'logout'}
                isLoading={inProgress === 'logout'}>
                {logout}
              </Button>
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
        </>
      );
    }
  };

  return accessComponent();
};

export default AccessSection;
