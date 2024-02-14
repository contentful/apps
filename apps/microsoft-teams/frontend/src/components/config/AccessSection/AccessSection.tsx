import { Dispatch, useEffect, useState } from 'react';
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
import { ConfigAppSDK } from '@contentful/app-sdk';
import DisconnectModal from '@components/config/DisconnectModal/DisconnectModal';
import { displayConfirmationNotifications } from '@helpers/configHelpers';
import MsGraph from '@utils/msGraphApi';

interface Props {
  dispatch: Dispatch<ParameterAction>;
  parameters: AppInstallationParameters;
  isAppInstalled: boolean;
}

const defaultOrgDetails = {
  orgName: '',
  orgLogo: '',
};

const AccessSection = (props: Props) => {
  const { dispatch, parameters, isAppInstalled } = props;
  const [orgDetails, setOrgDetails] = useState(defaultOrgDetails);

  const { instance, accounts, inProgress } = useMsal();
  const customApi = useCustomApi();
  const sdk = useSDK<ConfigAppSDK>();

  const loginInProgress = inProgress === 'login';
  const logoutInProgress = inProgress === 'logout';
  const { logout, login, teamsAppInfo, teamsAppLink, description, authError, orgDetailsError } =
    accessSection;

  useEffect(() => {
    if (accounts.length && parameters.tenantId) {
      getOrgDetails();
    }
  }, [accounts, parameters.tenantId]);

  const handleLogin = async () => {
    try {
      const authResult = await instance.loginPopup(loginRequest);
      if (!isAppInstalled) {
        await customApi.saveConfiguration({ ...parameters, tenantId: authResult.tenantId });
      }
      dispatch({
        type: actions.UPDATE_TENANT_ID,
        payload: authResult.tenantId,
      });
      if (isAppInstalled && authResult.tenantId !== parameters.tenantId) {
        displayConfirmationNotifications(
          sdk,
          accessSection.updateConfirmation,
          accessSection.saveWarning
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : authError;
      sdk.notifier.error(message);
      console.error(e);
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
            setOrgDetails(defaultOrgDetails);
            await instance.logoutPopup({
              postLogoutRedirectUri: '/',
              account: accounts[0],
            });
            dispatch({
              type: actions.UPDATE_TENANT_ID,
              payload: '',
            });
          }}
        />
      );
    });
  };

  const getOrgDetails = async () => {
    try {
      const msGraph = new MsGraph(instance, accounts[0]);
      const [orgName, orgLogo] = await Promise.all([
        msGraph.getOrganizationDisplayName(),
        msGraph.getOrganizationLogo(),
      ]);
      setOrgDetails({ orgName, orgLogo });
    } catch (e) {
      sdk.notifier.error(orgDetailsError);
      console.error(e);
    }
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
              isDisabled={loginInProgress}
              isLoading={loginInProgress}>
              {login}
            </Button>
          </Box>
        </>
      );
    } else {
      return (
        <>
          <Card padding="large">
            <Flex justifyContent="space-between" alignItems="center">
              <Flex>
                <Flex alignItems="center" marginRight="spacingM">
                  {orgDetails.orgLogo && (
                    <img className={styles.orgLogo} src={orgDetails.orgLogo} alt="logo"></img>
                  )}
                </Flex>
                <Flex flexDirection="column">
                  <Subheading marginBottom="none">{orgDetails.orgName}</Subheading>
                  <Paragraph marginBottom="none">{accounts[0]?.username}</Paragraph>
                </Flex>
              </Flex>
              <Button
                onClick={() => handleLogout()}
                isDisabled={logoutInProgress}
                isLoading={logoutInProgress}>
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
